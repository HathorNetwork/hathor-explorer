import requestClient from './axiosInstance';

const networkApi = {
  getPeers() {
    return requestClient.get(`status`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default networkApi;