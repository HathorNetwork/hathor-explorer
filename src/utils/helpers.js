import $ from 'jquery';
import walletApi from '../api/wallet';
import { GENESIS_BLOCK, GENESIS_TX } from '../constants';

const helpers = {
  showAlert(id, duration) {
    const el = $(`#${id}`);
    el.addClass('show');
    setTimeout(() => {
      el.removeClass('show');
    }, duration);
  },

  checkWalletLock(unlock, lock) {
    walletApi.checkLock().then((data) => {
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
  }
}

export default helpers;