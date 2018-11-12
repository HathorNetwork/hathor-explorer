import React from 'react';
import helpers from '../utils/helpers';

const WalletBalance = ({balance}) => <div><p><strong>Balance:</strong> {balance !== undefined ? helpers.prettyValue(balance) : ''} hathor{balance === 1 ? '' : 's'}</p></div>;

export default WalletBalance;