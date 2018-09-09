import React from 'react';
import ReactLoading from 'react-loading';
import WalletHistory from '../components/WalletHistory';
import WalletBalance from '../components/WalletBalance';
import walletApi from '../api/wallet';


class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      address: null,
      historyLoaded: false,
      balanceLoaded: false,
    }

    this.getAddress = this.getAddress.bind(this);
    this.sendTokens = this.sendTokens.bind(this);
    this.historyLoaded = this.historyLoaded.bind(this);
    this.balanceLoaded = this.balanceLoaded.bind(this);
  }

  sendTokens() {
    this.props.history.push('/wallet/send_tokens');
  }

  historyLoaded() {
    this.setState({historyLoaded: true});
  }

  balanceLoaded() {
    console.log('AHA')
    this.setState({balanceLoaded: true});
  }

  getAddress() {
    walletApi.getAddress().then((data) => {
      this.setState({address: data.address})
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  render() {
    const renderWallet = () => {
      return (
        <div>
          <WalletBalance loaded={this.balanceLoaded} />
          {renderAddress()}
          {renderSendTokensBtn()}
          <WalletHistory loaded={this.historyLoaded} />
        </div>
      );
    }

    const renderAddress = () => {
      return (
        <div className="flex flex-row align-items-center new-address-wrapper">
          <button className="btn new-address btn-primary" onClick={this.getAddress}>Get address</button>
          <span>{this.state.address}</span>
        </div>
      )
    }

    const renderSendTokensBtn = () => {
      return (
        <button className="btn send-tokens btn-primary" onClick={this.sendTokens}>Send tokens</button>
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {(this.state.historyLoaded && this.state.balanceLoaded) ? null : <ReactLoading type='spin' color='#0081af' delay={500} />}
        {renderWallet()}
      </div>
    );
  }
}

export default Wallet;