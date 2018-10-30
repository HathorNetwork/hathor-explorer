import React from 'react';

const WalletBalance = ({balance}) => <div><p><strong>Balance:</strong> {balance} hathor{balance === 1 ? '' : 's'}</p></div>;

export default WalletBalance;