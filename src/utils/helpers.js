import $ from 'jquery';
import walletApi from '../api/wallet';

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
  }
}

export default helpers;