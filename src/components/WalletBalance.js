import React from 'react';
import walletApi from '../api/wallet';


class WalletBalance extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      balance: null
    }

    this.updateBalance = this.updateBalance.bind(this);
  }

  componentDidMount() {
    walletApi.getBalance().then((data) => {
      this.updateBalance(data.balance);
      this.props.loaded();
    }, (e) => {
      // Error in request
      console.log(e);
    });
  }

  updateBalance(balance) {
    this.setState({balance})
  }

  render() {
    const renderBalance = () => {
      return (
        <div>
          <p><strong>Balance:</strong> {this.state.balance} hathor{this.state.balance === 1 ? '' : 's'}</p>
        </div>
      );
    }

    return (
      <div>
        {renderBalance()}
      </div>
    );
  }
}

export default WalletBalance;