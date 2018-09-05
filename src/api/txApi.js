import requestClient from './axiosInstance';

const txApi = {
  getTransactions(page, count) {
    const data = {page, count};
    return requestClient.get(`transaction`, {params: data}).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default txApi;