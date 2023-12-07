import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import AssetList from '../../components/app/asset-list';
import NFTList from '../../components/app/nft-list';
import StakableList from '../../components/app/stakable-list';
import HomeNotification from '../../components/app/home-notification';
import MultipleNotifications from '../../components/app/multiple-notifications';
import TransactionList from '../../components/app/transaction-list';
import MenuBar from '../../components/app/menu-bar';
import Popover from '../../components/ui/popover';
import Button from '../../components/ui/button';
import ConnectedSites from '../connected-sites';
import ConnectedAccounts from '../connected-accounts';
import { Tabs, Tab } from '../../components/ui/tabs';
import { EthOverview } from '../../components/app/wallet-overview';
import {
  ASSET_ROUTE,
  NFT_ROUTE,
  STAKE_ASSET_ROUTE,
  WRAP_ASSET_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  CONNECT_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
} from '../../helpers/constants/routes';
import WrappingList from '../../components/app/wrapping-list/wrapping-list';
import { TFUEL_SYMBOL } from '../../../app/scripts/controllers/network/enums';

const LEARN_MORE_URL =
  'https://docs.gtx.io/en-us/articles/360045129011-Intro-to-GTx-extension';

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    shouldShowSeedPhraseReminder: PropTypes.bool,
    isPopup: PropTypes.bool,
    isNotification: PropTypes.bool.isRequired,
    firstPermissionsRequestId: PropTypes.string,
    totalUnapprovedCount: PropTypes.number.isRequired,
    setConnectedStatusPopoverHasBeenShown: PropTypes.func,
    connectedStatusPopoverHasBeenShown: PropTypes.bool,
    defaultHomeActiveTabName: PropTypes.string,
    onTabClick: PropTypes.func.isRequired,
    nativeCurrency: PropTypes.string,
    selectedNative: PropTypes.bool,
  };

  state = {
    mounted: false,
  };

  componentDidMount() {
    const {
      firstPermissionsRequestId,
      history,
      isNotification,
      suggestedTokens = {},
      totalUnapprovedCount,
      unconfirmedTransactionsCount,
    } = this.props;

    this.setState({ mounted: true });
    if (isNotification && totalUnapprovedCount === 0) {
      global.platform.closeCurrentWindow();
    } else if (firstPermissionsRequestId) {
      history.push(`${CONNECT_ROUTE}/${firstPermissionsRequestId}`);
    } else if (unconfirmedTransactionsCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE);
    } else if (Object.keys(suggestedTokens).length > 0) {
      history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE);
    }
  }

  static getDerivedStateFromProps(
    {
      firstPermissionsRequestId,
      isNotification,
      suggestedTokens,
      totalUnapprovedCount,
      unconfirmedTransactionsCount,
    },
    { mounted },
  ) {
    if (!mounted) {
      if (isNotification && totalUnapprovedCount === 0) {
        return { closing: true };
      } else if (
        firstPermissionsRequestId ||
        unconfirmedTransactionsCount > 0 ||
        Object.keys(suggestedTokens).length > 0
      ) {
        return { redirecting: true };
      }
    }
    return null;
  }

  componentDidUpdate(_, prevState) {
    if (!prevState.closing && this.state.closing) {
      global.platform.closeCurrentWindow();
    }
  }

  renderWrapping() {
    const { history } = this.props;

    return (
      <WrappingList
        onClickAsset={(asset) => history.push(`${WRAP_ASSET_ROUTE}/${asset}`)}
      />
    );
  }

  renderNfts() {
    const { history } = this.props;

    return (
      <NFTList
        onClickAsset={(asset) => history.push(`${NFT_ROUTE}/${asset}`)}
      />
    );
  }

  renderNotifications() {
    const { t } = this.context;
    const { history, shouldShowSeedPhraseReminder, isPopup } = this.props;

    return (
      <MultipleNotifications>
        {shouldShowSeedPhraseReminder ? (
          <HomeNotification
            descriptionText={t('backupApprovalNotice')}
            acceptText={t('backupNow')}
            onAccept={() => {
              if (isPopup) {
                global.platform.openExtensionInBrowser(
                  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
                );
              } else {
                history.push(INITIALIZE_BACKUP_SEED_PHRASE_ROUTE);
              }
            }}
            infoText={t('backupApprovalInfo')}
            key="home-backupApprovalNotice"
          />
        ) : null}
      </MultipleNotifications>
    );
  }

  renderPopover = () => {
    const { setConnectedStatusPopoverHasBeenShown } = this.props;
    const { t } = this.context;
    return (
      <Popover
        title={t('whatsThis')}
        onClose={setConnectedStatusPopoverHasBeenShown}
        className="home__connected-status-popover"
        showArrow
        CustomBackground={({ onClose }) => {
          return (
            <div
              className="home__connected-status-popover-bg-container"
              onClick={onClose}
            >
              <div className="home__connected-status-popover-bg" />
            </div>
          );
        }}
        footer={
          <>
            <a href={LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
              {t('learnMore')}
            </a>
            <Button
              type="primary"
              onClick={setConnectedStatusPopoverHasBeenShown}
            >
              {t('dismiss')}
            </Button>
          </>
        }
      >
        <main className="home__connect-status-text">
          <div>{t('metaMaskConnectStatusParagraphOne')}</div>
          <div>{t('metaMaskConnectStatusParagraphTwo')}</div>
          <div>{t('metaMaskConnectStatusParagraphThree')}</div>
        </main>
      </Popover>
    );
  };

  render() {
    const { t } = this.context;
    const {
      defaultHomeActiveTabName,
      onTabClick,
      forgottenPassword,
      history,
      connectedStatusPopoverHasBeenShown,
      isPopup,
      nativeCurrency,
      selectedNative,
    } = this.props;

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />;
    } else if (this.state.closing || this.state.redirecting) {
      return null;
    }

    const onThetaNative = selectedNative && nativeCurrency === TFUEL_SYMBOL;

    return (
      <div className="main-container">
        <Route path={CONNECTED_ROUTE} component={ConnectedSites} exact />
        <Route
          path={CONNECTED_ACCOUNTS_ROUTE}
          component={ConnectedAccounts}
          exact
        />
        <div className="home__container">
          {isPopup && !connectedStatusPopoverHasBeenShown
            ? this.renderPopover()
            : null}
          <div className="home__main-view">
            <MenuBar />
            <div className="home__balance-wrapper">
              <EthOverview />
            </div>
            <Tabs
              defaultActiveTabName={defaultHomeActiveTabName}
              onTabClick={onTabClick}
              tabsClassName="home__tabs"
            >
              <Tab
                activeClassName="home__tab--active"
                className="home__tab"
                data-testid="home__asset-tab"
                name={t('assets')}
              >
                <AssetList
                  onClickAsset={(asset) =>
                    history.push(`${ASSET_ROUTE}/${asset}`)
                  }
                />
              </Tab>
              <Tab
                activeClassName="home__tab--active"
                className="home__tab"
                data-testid={onThetaNative ? 'home__wrap-tab' : 'home__nft-tab'}
                name={t(onThetaNative ? 'wrapping' : 'NFTs')}
              >
                {onThetaNative ? this.renderWrapping() : this.renderNfts()}
              </Tab>
              {onThetaNative && (
                <Tab
                  activeClassName="home__tab--active"
                  className="home__tab"
                  data-testid="home__staking-tab"
                  name={t('staking')}
                >
                  <StakableList
                    onClickAsset={(asset) =>
                      history.push(`${STAKE_ASSET_ROUTE}/${asset}`)
                    }
                  />
                </Tab>
              )}
              <Tab
                activeClassName="home__tab--active"
                className="home__tab"
                data-testid="home__activity-tab"
                name={t('activity')}
              >
                <TransactionList showPurposes={null} />
              </Tab>
            </Tabs>
          </div>
          {this.renderNotifications()}
        </div>
      </div>
    );
  }
}
