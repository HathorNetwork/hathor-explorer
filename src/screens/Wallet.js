import React from 'react';
import ReactLoading from 'react-loading';
import WalletHistory from '../components/WalletHistory';
import WalletBalance from '../components/WalletBalance';
import WalletAddress from '../components/WalletAddress';


class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addressLoaded: null,
      newAddress: false,
      historyLoaded: false,
      balanceLoaded: false,
    }

    this.sendTokens = this.sendTokens.bind(this);
    this.historyLoaded = this.historyLoaded.bind(this);
    this.balanceLoaded = this.balanceLoaded.bind(this);
    this.addressLoaded = this.addressLoaded.bind(this);
  }

  sendTokens() {
    this.props.history.push('/wallet/send_tokens');
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
              <WalletBalance loaded={this.balanceLoaded} />
              {renderSendTokensBtn()}
            </div>
            <WalletAddress loaded={this.addressLoaded} />
          </div>
            <WalletHistory loaded={this.historyLoaded} />
        </div>
      );
    }

    const renderSendTokensBtn = () => {
      return (
        <button className="btn send-tokens btn-primary" onClick={this.sendTokens}>Send tokens</button>
      );
    }
    
    return (
      <div className="content-wrapper flex align-items-center">
        {(this.state.historyLoaded && this.state.balanceLoaded && this.state.addressLoaded) ? null : <ReactLoading type='spin' color='#0081af' delay={500} />}
        {renderWallet()}
      </div>
    );
  }
}

export default Wallet;