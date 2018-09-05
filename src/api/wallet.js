import requestClient from './axiosInstance';

const walletApi = {
  getBalance() {
    return requestClient.get('wallet/balance').then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getHistory() {
    return requestClient.get('wallet/history').then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getNewAddress() {
    return requestClient.get('wallet/address').then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default walletApi;