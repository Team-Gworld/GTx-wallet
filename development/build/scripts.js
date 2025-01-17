const gulp = require('gulp');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('fancy-log');
const { assign } = require('lodash');
const watchify = require('watchify');
const browserify = require('browserify');
const envify = require('loose-envify/custom');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser-js');
const pify = require('pify');
const endOfStream = pify(require('end-of-stream'));
const babelify = require('babelify');
const brfs = require('brfs');

const conf = require('rc')('gtxwallet', {
  INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
});

const baseManifest = require('../../app/manifest/_base.json');

const packageJSON = require('../../package.json');
const {
  createTask,
  composeParallel,
  composeSeries,
  runInChildProcess,
} = require('./task');

module.exports = createScriptTasks;

const dependencies = Object.keys(
  (packageJSON && packageJSON.dependencies) || {},
);
const materialUIDependencies = ['@material-ui/core'];
const reactDepenendencies = dependencies.filter((dep) => dep.match(/react/u));

const externalDependenciesMap = {
  background: [],
  ui: [...materialUIDependencies, ...reactDepenendencies],
};

function createScriptTasks({ browserPlatforms, livereload }) {
  // internal tasks
  const core = {
    // dev tasks (live reload)
    dev: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:dev',
      devMode: true,
    }),
    testDev: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:test-live',
      devMode: true,
      testing: true,
    }),
    // built for CI tests
    test: createTasksForBuildJsExtension({
      taskPrefix: 'scripts:core:test',
      testing: true,
    }),
    // production
    prod: createTasksForBuildJsExtension({ taskPrefix: 'scripts:core:prod' }),
  };
  const deps = {
    background: createTasksForBuildJsDeps({
      filename: 'bg-libs',
      key: 'background',
    }),
    ui: createTasksForBuildJsDeps({ filename: 'ui-libs', key: 'ui' }),
  };

  // high level tasks

  const prod = composeParallel(deps.background, deps.ui, core.prod);

  const { dev, testDev } = core;

  const test = composeParallel(deps.background, deps.ui, core.test);

  return { prod, dev, testDev, test };

  function createTasksForBuildJsDeps({ key, filename }) {
    return createTask(
      `scripts:deps:${key}`,
      bundleTask({
        label: filename,
        filename: `${filename}.js`,
        buildLib: true,
        dependenciesToBundle: externalDependenciesMap[key],
        devMode: false,
      }),
    );
  }

  function createTasksForBuildJsExtension({ taskPrefix, devMode, testing }) {
    const standardBundles = [
      'background',
      'ui',
      'phishing-detect',
      'initSentry',
    ];

    const standardSubtasks = standardBundles.map((filename) => {
      return createTask(
        `${taskPrefix}:${filename}`,
        createBundleTaskForBuildJsExtensionNormal({
          filename,
          devMode,
          testing,
        }),
      );
    });
    // inpage must be built before contentscript
    // because inpage bundle result is included inside contentscript
    const contentscriptSubtask = createTask(
      `${taskPrefix}:contentscript`,
      createTaskForBuildJsExtensionContentscript({ devMode, testing }),
    );

    // task for initiating livereload
    const initiateLiveReload = async () => {
      if (devMode) {
        // trigger live reload when the bundles are updated
        // this is not ideal, but overcomes the limitations:
        // - run from the main process (not child process tasks)
        // - after the first build has completed (thus the timeout)
        // - build tasks never "complete" when run with livereload + child process
        setTimeout(() => {
          watch('./dist/*/*.js', (event) => {
            livereload.changed(event.path);
          });
        }, 75e3);
      }
    };

    // make each bundle run in a separate process
    const allSubtasks = [...standardSubtasks, contentscriptSubtask].map(
      (subtask) => runInChildProcess(subtask),
    );
    // const allSubtasks = [...standardSubtasks, contentscriptSubtask].map(subtask => (subtask))
    // make a parent task that runs each task in a child thread
    return composeParallel(initiateLiveReload, ...allSubtasks);
  }

  function createBundleTaskForBuildJsExtensionNormal({
    filename,
    devMode,
    testing,
  }) {
    return bundleTask({
      label: filename,
      filename: `${filename}.js`,
      filepath: `./app/scripts/${filename}.js`,
      externalDependencies: devMode
        ? undefined
        : externalDependenciesMap[filename],
      devMode,
      testing,
    });
  }

  function createTaskForBuildJsExtensionContentscript({ devMode, testing }) {
    const inpage = 'inpage';
    const contentscript = 'contentscript';
    return composeSeries(
      bundleTask({
        label: inpage,
        filename: `${inpage}.js`,
        filepath: `./app/scripts/${inpage}.js`,
        externalDependencies: devMode
          ? undefined
          : externalDependenciesMap[inpage],
        devMode,
        testing,
      }),
      bundleTask({
        label: contentscript,
        filename: `${contentscript}.js`,
        filepath: `./app/scripts/${contentscript}.js`,
        externalDependencies: devMode
          ? undefined
          : externalDependenciesMap[contentscript],
        devMode,
        testing,
      }),
    );
  }

  function bundleTask(opts) {
    let bundler;

    return performBundle;

    async function performBundle() {
      // initialize bundler if not available yet
      // dont create bundler until task is actually run
      if (!bundler) {
        bundler = generateBundler(opts, performBundle);
        // output build logs to terminal
        bundler.on('log', log);
      }

      let buildStream = bundler.bundle();

      // handle errors
      buildStream.on('error', (err) => {
        beep();
        if (opts.devMode) {
          console.warn(err.stack);
        } else {
          throw err;
        }
      });

      // process bundles
      buildStream = buildStream
        // convert bundle stream to gulp vinyl stream
        .pipe(source(opts.filename))
        // buffer file contents (?)
        .pipe(buffer());

      // Initialize Source Maps
      buildStream = buildStream
        // loads map from browserify file
        .pipe(sourcemaps.init({ loadMaps: true }));

      // Minification
      if (!opts.devMode) {
        buildStream = buildStream.pipe(
          terser({
            mangle: {
              reserved: ['MetamaskInpageProvider'],
            },
            sourceMap: {
              content: true,
            },
          }),
        );
      }

      // Finalize Source Maps
      if (opts.devMode) {
        // Use inline source maps for development due to Chrome DevTools bug
        // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
        buildStream = buildStream.pipe(sourcemaps.write());
      } else {
        buildStream = buildStream.pipe(sourcemaps.write('../sourcemaps'));
      }

      // write completed bundles
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}`;
        buildStream = buildStream.pipe(gulp.dest(dest));
      });

      await endOfStream(buildStream);
    }
  }

  function generateBundler(opts, performBundle) {
    const browserifyOpts = assign({}, watchify.args, {
      plugin: [],
      transform: [],
      debug: true,
      fullPaths: opts.devMode,
    });

    if (!opts.buildLib) {
      if (opts.devMode && opts.filename === 'ui.js') {
        browserifyOpts.entries = [
          './development/require-react-devtools.js',
          opts.filepath,
        ];
      } else {
        browserifyOpts.entries = [opts.filepath];
      }
    }

    let bundler = browserify(browserifyOpts)
      .transform(babelify)
      .transform(brfs);

    if (opts.buildLib) {
      bundler = bundler.require(opts.dependenciesToBundle);
    }

    if (opts.externalDependencies) {
      bundler = bundler.external(opts.externalDependencies);
    }

    const environment = getEnvironment({
      devMode: opts.devMode,
      test: opts.testing,
    });
    if (environment === 'production' && !process.env.SENTRY_DSN) {
      throw new Error('Missing SENTRY_DSN environment variable');
    }

    // Inject variables into bundle
    bundler.transform(
      envify({
        METAMASK_DEBUG: opts.devMode,
        METAMASK_ENVIRONMENT: environment,
        METAMASK_VERSION: baseManifest.version,
        METAMETRICS_PROJECT_ID: process.env.METAMETRICS_PROJECT_ID,
        NODE_ENV: opts.devMode ? 'development' : 'production',
        IN_TEST: opts.testing ? 'true' : false,
        PUBNUB_SUB_KEY: process.env.PUBNUB_SUB_KEY || '',
        PUBNUB_PUB_KEY: process.env.PUBNUB_PUB_KEY || '',
        ETH_GAS_STATION_API_KEY: process.env.ETH_GAS_STATION_API_KEY || '',
        CONF: opts.devMode ? conf : {},
        SENTRY_DSN: process.env.SENTRY_DSN,
        INFURA_PROJECT_ID: opts.testing
          ? '00000000000000000000000000000000'
          : conf.INFURA_PROJECT_ID,
      }),
      {
        global: true,
      },
    );

    // Live reload - minimal rebundle on change
    if (opts.devMode) {
      bundler = watchify(bundler);
      // on any file update, re-runs the bundler
      bundler.on('update', () => {
        performBundle();
      });
    }

    return bundler;
  }
}

function beep() {
  process.stdout.write('\x07');
}

function getEnvironment({ devMode, test }) {
  // get environment slug
  if (devMode) {
    return 'development';
  } else if (test) {
    return 'testing';
  } else if (process.env.CIRCLE_BRANCH === 'master') {
    return 'production';
  } else if (
    /^Version-v(\d+)[.](\d+)[.](\d+)/u.test(process.env.CIRCLE_BRANCH)
  ) {
    return 'release-candidate';
  } else if (process.env.CIRCLE_BRANCH === 'develop') {
    return 'staging';
  } else if (process.env.CIRCLE_PULL_REQUEST) {
    return 'pull-request';
  }
  return 'other';
}
