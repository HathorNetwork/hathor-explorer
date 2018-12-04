import React from 'react';
import helpers from '../utils/helpers';

const WalletBalance = ({balance}) => {
  const renderBalance = () => {
    return (
      <div>
        <p><strong>Total:</strong> {helpers.prettyValue(balance.available + balance.locked)} hathor{balance === 1 ? '' : 's'}</p>
        <p><strong>Available:</strong> {helpers.prettyValue(balance.available)} hathor{balance === 1 ? '' : 's'}</p>
        <p><strong>Locked:</strong> {helpers.prettyValue(balance.locked)} hathor{balance === 1 ? '' : 's'}</p>
      </div>
    );
  }

  return (
    <div>
      {balance && renderBalance()}
    </div>
  );
};

export default WalletBalance;