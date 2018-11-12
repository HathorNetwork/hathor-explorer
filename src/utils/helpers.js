import walletApi from '../api/wallet';
import { GENESIS_BLOCK, GENESIS_TX, DECIMAL_PLACES } from '../constants';

const helpers = {
  checkWalletLock(unlock, lock, setType) {
    walletApi.checkLock().then((data) => {
      setType(data.type)
      if (!data.is_locked) {
        unlock();
      } else {
        lock();
      }
    }, (e) => {
      // Error in request
      console.log(e);
    });
  },

  updateListWs(list, newEl, max) {
    // We remove the last element if we already have the max
    if (list.length === max) {
      list.pop();
    }
    // Then we add the new on in the first position
    list.splice(0, 0, newEl);
    return list;
  },

  getTxType(tx) {
    if (GENESIS_TX.indexOf(tx.hash) > -1) {
      return 'Tx';
    } else if (GENESIS_BLOCK.indexOf(tx.hash) > -1) {
      return 'Block';
    } else {
      if (tx.inputs.length > 0) {
        return 'Tx';
      } else {
        return 'Block';
      }
    }
  },

  roundFloat(n) {
    return Math.round(n*100)/100
  },

  prettyValue(value) {
    return (value/10**DECIMAL_PLACES).toFixed(DECIMAL_PLACES);
  }
}

export default helpers;
