import requestClient from './axiosInstance';

const versionApi = {
  getVersion() {
    return requestClient.get(`version`).then((res) => {
      return res.data
    }, (res) => {
      throw new Error(res.data.message);
    });
  }
};

export default versionApi;