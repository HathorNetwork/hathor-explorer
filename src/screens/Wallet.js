import React from 'react';
import ReactLoading from 'react-loading';
import WalletHistory from '../components/WalletHistory';
import WalletBalance from '../components/WalletBalance';
import WalletAddress from '../components/WalletAddress';
import { WS_URL } from '../constants';
import HathorAlert from '../components/HathorAlert';
import helpers from '../utils/helpers';
import WalletAuth from '../components/WalletAuth';
import walletApi from '../api/wallet';


class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      newAddress: false,
      historyLoaded: false,
      balanceLoaded: false,
      addressLoaded: false,
      lockDisabled: false,
      warning: null,
      locked: null,
    }

    this.sendTokens = this.sendTokens.bind(this);
    this.historyLoaded = this.historyLoaded.bind(this);
    this.balanceLoaded = this.balanceLoaded.bind(this);
    this.addressLoaded = this.addressLoaded.bind(this);
    this.unlock = this.unlock.bind(this);
    this.lock = this.lock.bind(this);
    this.willLockWallet = this.willLockWallet.bind(this);

    this.ws = null;
  }

  componentDidMount() {
    this.ws = new WebSocket(WS_URL)
    this.ws.onmessage = (event) => {
      this.handleWebsocket(JSON.parse(event.data));
    }

    helpers.checkWalletLock(this.unlock, this.lock);
  }

  lock() {
    this.setState({ locked: true });
  }

  unlock() {
    this.setState({ locked: false });
  }

  updateBalance(balance) {
    if (this.balanceNode) {
      this.balanceNode.updateBalance(balance);
    }
  }

  newOutput(output, total) {
    if (this.historyNode) {
      this.historyNode.newOutput(output, total);
    }
  }

  outputSpent(spent) {
    if (this.historyNode) {
      this.historyNode.outputSpent(spent);
    }
  }

  keysWarning(keysCount) {
    const warnMessage = `${keysCount} new keys were generated! Backup your wallet`;
    this.setState({ warning: warnMessage })
    helpers.showAlert('alert-warning', 5000);
  }

  handleWebsocket(wsData) {
    if (wsData.type === 'wallet:balance_updated') {
      this.updateBalance(wsData.balance);
    } else if (wsData.type === 'wallet:output_received') {
      this.newOutput(wsData.output, wsData.total);
    } else if (wsData.type === 'wallet:output_spent') {
      this.outputSpent(wsData.output_spent);
    } else if (wsData.type === 'wallet:keys_generated') {
      this.keysWarning(wsData.keys_count);
    }
  }

  sendTokens() {
    this.props.history.push('/wallet/send_tokens');
  }

  willLockWallet() {
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

  historyLoaded() {
    this.setState({historyLoaded: true});
  }

  balanceLoaded() {
    this.setState({balanceLoaded: true});
  }

  addressLoaded() {
    this.setState({addressLoaded: true});
  }

  render() {
    const renderWallet = () => {
      return (
        <div>
          <div className="d-flex flex-row align-items-center justify-content-between">
            <div className="d-flex flex-column align-items-start justify-content-between">
              <WalletBalance ref={(node) => { this.balanceNode = node; }} loaded={this.balanceLoaded} />
              {renderBtns()}
            </div>
            <WalletAddress loaded={this.addressLoaded} />
          </div>
          <WalletHistory ref={(node) => { this.historyNode = node; }} loaded={this.historyLoaded} />
        </div>
      );
    }

    const renderBtns = () => {
      return (
        <div>
          <div><button className="btn send-tokens btn-primary" onClick={this.sendTokens}>Send tokens</button></div>
          <div><button className="btn send-tokens btn-primary" onClick={this.willLockWallet} disabled={this.state.lockDisabled}>Lock wallet</button></div>
        </div>
      );
    }

    const renderUnlockedWallet = () => {
      return (
        <div>
          {(this.state.historyLoaded && this.state.balanceLoaded && this.state.addressLoaded) ? null : <ReactLoading type='spin' color='#0081af' delay={500} />}
          {renderWallet()}
          {this.state.warning ? <HathorAlert id="alert-warning" text={this.state.warning} type="warning" /> : null}
        </div>
      );
    }

    const renderLockedWallet = () => {
      return (
        <WalletAuth unlock={this.unlock} />
      );
    }
    
    return (
      <div className="content-wrapper">
        {this.state.locked === true ? renderLockedWallet() : null}
        {this.state.locked === false ? renderUnlockedWallet() : null}
      </div>
    );
  }
}

export default Wallet;