import requestClient from './axiosInstance';

const walletApi = {
  getBalance() {
    return requestClient.get('wallet/balance').then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getHistory(page, count) {
    const data = {page, count};
    return requestClient.get('wallet/history', {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getAddress(data) {
    return requestClient.get('wallet/address', {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  sendTokens(data) {
    const postData = {data};
    return requestClient.post('wallet/send_tokens', postData).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  checkLock() {
    return requestClient.get('wallet/state').then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  unlock(password) {
    const postData = {password};
    return requestClient.post('wallet/unlock', postData).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  unlockHD(words, passphrase) {
    let postData = {passphrase};
    if (words) {
      postData['words'] = words;
    }
    return requestClient.post('wallet/unlock', postData).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  lock() {
    return requestClient.post('wallet/lock').then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },
};

export default walletApi;