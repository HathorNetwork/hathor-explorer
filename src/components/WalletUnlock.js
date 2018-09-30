import React from 'react';
import WalletAuth from './WalletAuth';
import HDWalletAuth from './HDWalletAuth';


class WalletUnlock extends React.Component {
  render() {
    return (
      <div>
        {this.props.walletType === 'hd' ? <HDWalletAuth unlock={this.props.unlock} /> : <WalletAuth unlock={this.props.unlock} />}
      </div>
    )
  }
}

export default WalletUnlock;