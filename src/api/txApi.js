import requestClient from './axiosInstance';

const txApi = {
  getTransactionBase(data) {
    return requestClient.get(`transaction`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getTransactions(type, count, hash, page) {
    /*
     type: 'block' or 'tx' -> if we are getting txs or blocks
     count: int -> how many objects we want
     hash (optional): str -> hash reference for the pagination (works together with 'page' parameter)
     page (optional): 'previous' or 'next' -> if 'previous', we get the objects before the hash reference
                                   if 'next', we get the objects after the hash reference
    */
    const data = {type, count};
    if (hash) {
      data['hash'] = hash;
      data['page'] = page;
    }
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

  pushTx(hex_tx, force) {
    const data = {hex_tx, force}
    return requestClient.get(`push_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },

  getDashboardTx(block, tx) {
    const data = {block, tx}
    return requestClient.get(`dashboard_tx`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  },
};

export default txApi;