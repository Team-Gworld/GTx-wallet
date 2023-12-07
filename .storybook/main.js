module.exports = {
  stories: ['../ui/**/*.stories.js'],
  addons: [
    '@storybook/addon-knobs',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
  ],
  staticDirs: ['../app', './images'],
};
