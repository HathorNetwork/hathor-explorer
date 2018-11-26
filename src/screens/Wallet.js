import React from 'react';
import ReactLoading from 'react-loading';
import WalletHistory from '../components/WalletHistory';
import WalletBalance from '../components/WalletBalance';
import WalletAddress from '../components/WalletAddress';
import HathorAlert from '../components/HathorAlert';
import helpers from '../utils/helpers';
import WalletUnlock from '../components/WalletUnlock';
import walletApi from '../api/wallet';
import WebSocketHandler from '../WebSocketHandler';


class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      walletType: '',
      newAddress: false,
      historyLoaded: false,
      balanceLoaded: false,
      addressLoaded: false,
      lockDisabled: false,
      warning: null,
      locked: null,
    }

    this.showWarning = this.showWarning.bind(this);
  }

  componentDidMount() {
    helpers.checkWalletLock(this.unlock, this.lock, this.setType);

    this.getInitialBalance();

    WebSocketHandler.on('wallet', this.handleWebsocket);
  }

  componentWillUnmount() {
    WebSocketHandler.removeListener('wallet', this.handleWebsocket);
  }

  getInitialBalance() {
    walletApi.getBalance().then((data) => {
      this.updateBalance(data.balance);
      this.balanceLoaded();
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  setType = (type) => {
    this.setState({ walletType: type })
  }

  lock = () => {
    this.setState({ locked: true });
  }

  unlock = () => {
    this.setState({ locked: false });
  }

  updateBalance = (balance) => {
    this.setState({ balance });
  }

  newOutput = (output, total) => {
    if (this.historyNode) {
      this.historyNode.newOutput(output, total);
    }
  }

  outputSpent = (spent) => {
    if (this.historyNode) {
      this.historyNode.outputSpent(spent);
    }
  }

  historyUpdated = () => {
    if (this.historyNode) {
      this.historyNode.getHistoryData();
    }
  }

  showWarning = (message) => {
    this.setState({ warning: message })
    this.refs.alertWarning.show(5000);
  }

  backupKeysWarning = (keysCount) => {
    const warnMessage = `${keysCount} new keys were generated! Backup your wallet`;
    this.showWarning(warnMessage);
  }

  gapLimitWarning = () => {
    const warnMessage = 'You have achieved the limit of unused addresses in sequence. Use this one to generate more.';
    this.showWarning(warnMessage);
  }

  handleWebsocket = (wsData) => {
    if (wsData.type === 'wallet:balance_updated') {
      this.updateBalance(wsData.balance);
    } else if (wsData.type === 'wallet:output_received') {
      this.newOutput(wsData.output, wsData.total);
    } else if (wsData.type === 'wallet:output_spent') {
      this.outputSpent(wsData.output_spent);
    } else if (wsData.type === 'wallet:keys_generated') {
      this.backupKeysWarning(wsData.keys_count);
    } else if (wsData.type === 'wallet:gap_limit') {
      this.gapLimitWarning();
    } else if (wsData.type === 'wallet:history_updated') {
      this.historyUpdated();
    }
  }

  sendTokens = () => {
    this.props.history.push('/wallet/send_tokens');
  }

  willLockWallet = () => {
    this.setState({ lockDisabled: true }, () => {
      walletApi.lock().then((res) => {
        this.setState({ lockDisabled: false });
        if (res.success) {
          this.lock();
        }
      }, (e) => {
        // Error in request
        console.log(e);
      });
    })
  }

  historyLoaded = () => {
    this.setState({historyLoaded: true});
  }

  balanceLoaded = () => {
    this.setState({balanceLoaded: true});
  }

  addressLoaded = () => {
    this.setState({addressLoaded: true});
  }

  render() {
    const renderWallet = () => {
      return (
        <div>
          <div className="d-none d-sm-flex flex-row align-items-center justify-content-between">
            <div className="d-flex flex-column align-items-start justify-content-between">
              <WalletBalance balance={this.state.balance} />
              {renderBtns("d-flex flex-column")}
            </div>
            <WalletAddress loaded={this.addressLoaded} />
          </div>
          <div className="d-sm-none d-flex flex-column align-items-center justify-content-between">
            <div className="d-flex flex-column align-items-center justify-content-between">
              <WalletBalance balance={this.state.balance} />
              <div className="d-flex flex-row align-items-center">
                {renderBtns("d-flex")}
              </div>
            </div>
            <WalletAddress loaded={this.addressLoaded} />
          </div>
          <WalletHistory ref={(node) => { this.historyNode = node; }} loaded={this.historyLoaded} />
        </div>
      );
    }

    const renderBtns = (wrapperClass) => {
      return (
        <div className={wrapperClass}>
          <div><button className="btn send-tokens btn-primary" onClick={this.sendTokens}>Send tokens</button></div>
          <div><button className="btn btn-primary" onClick={this.willLockWallet} disabled={this.state.lockDisabled}>Lock wallet</button></div>
        </div>
      );
    }

    const renderUnlockedWallet = () => {
      return (
        <div>
          {(this.state.historyLoaded && this.state.balanceLoaded && this.state.addressLoaded) ? null : <ReactLoading type='spin' color='#0081af' delay={500} />}
          {renderWallet()}
          {this.state.warning ? <HathorAlert ref="alertWarning" text={this.state.warning} type="warning" /> : null}
        </div>
      );
    }
    
    return (
      <div className="content-wrapper">
        {this.state.locked === true ? <WalletUnlock walletType={this.state.walletType} unlock={this.unlock}/> : null}
        {this.state.locked === false ? renderUnlockedWallet() : null}
      </div>
    );
  }
}

export default Wallet;
