import React from 'react';
import walletApi from '../api/wallet';


class WalletBalance extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      balance: null
    }
  }

  componentWillMount() {
    walletApi.getBalance().then((data) => {
      console.log('UHU');
      this.setState({balance: data.balance})
      this.props.loaded();
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

    return (
      <div className="content-wrapper flex align-items-center">
        {renderBalance()}
      </div>
    );
  }
}

export default WalletBalance;