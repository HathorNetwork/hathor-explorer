import requestClient from './axiosInstance';

const txApi = {
  getTransactionBase(data) {
    return requestClient.get(`transaction`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getTransactions(page, count) {
    const data = {page, count};
    return this.getTransactionBase(data);
  },

  getTransaction(id) {
    const data = {id};
    return this.getTransactionBase(data);
  },

  decodeTx(hex_tx) {
    const data = {hex_tx}
    return requestClient.get(`decode_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  pushTx(hex_tx) {
    const data = {hex_tx}
    return requestClient.get(`push_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default txApi;