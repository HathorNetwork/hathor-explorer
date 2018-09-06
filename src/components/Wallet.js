import React from 'react';
import ReactLoading from 'react-loading';
import dateFormatter from '../utils/date';
import walletApi from '../api/wallet';


class Wallet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      balance: null,
      address: null,
      history: null,
      loaded: false,
    }

    this.getAddress = this.getAddress.bind(this);
    this.sendTokens = this.sendTokens.bind(this);
  }

  componentWillMount() {
    walletApi.getBalance().then((data) => {
      this.setState({balance: data.balance, loaded: this.state.history !== null})
    }, (e) => {
      // Error in request
      console.log(e);
    });

    walletApi.getHistory().then((data) => {
      this.setState({history: data.history, loaded: this.state.balance !== null})
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  sendTokens() {
    this.props.history.push('/wallet/send_tokens');
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
    const renderBalance = () => {
      return (
        <div>
          <p><strong>Balance:</strong> {this.state.balance} hathor{this.state.balance === 1 ? '' : 's'}</p>
        </div>
      );
    }

    const renderWallet = () => {
      return (
        <div>
          {renderBalance()}
          {renderAddress()}
          {renderSendTokensBtn()}
          {renderHistory()}
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

    const renderHistory = () => {
      return (
        <div className="flex">
          <strong>Transaction history</strong>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Index</th>
                <th>Value</th>
                <th>Spent</th>
              </tr>
            </thead>
            <tbody>
              {renderHistoryData()}
            </tbody>
          </table>
        </div>
      );
    }

    const renderHistoryData = () => {
      return this.state.history.map((tx, idx) => {
        return (
          <tr key={tx.tx_id}>
            <td>{tx.tx_id}</td>
            <td>{dateFormatter.parseTimestamp(tx.timestamp)}</td>
            <td>{tx.index}</td>
            <td>{tx.value}</td>
            <td>{tx.spent ? 'Yes' : 'No'}</td>
          </tr>
        );
      });
    }

    const renderSendTokensBtn = () => {
      return (
        <button className="btn send-tokens btn-primary" onClick={this.sendTokens}>Send tokens</button>
      );
    }

    return (
      <div className="content-wrapper flex align-items-center">
        {!this.state.loaded ? <ReactLoading type='spin' color='#0081af' delay={500} /> : renderWallet()}
      </div>
    );
  }
}

export default Wallet;