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
    let formData = new FormData();
    formData.append("data", JSON.stringify(data));
    return requestClient.post('wallet/send_tokens', formData).then((res) => {
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
    let formData = new FormData();
    formData.append('password', password);
    return requestClient.post('wallet/unlock', formData).then((res) => {
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
  }
};

export default walletApi;