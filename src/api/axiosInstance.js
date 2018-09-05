import { BASE_URL } from '../constants.js';
const axios = require('axios');

const requestClient = () => {
  const defaultOptions = {
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  let instance = axios.create(defaultOptions);
  instance.interceptors.response.use((response) => {
    return response;
  }, (error) => {
    console.log("ERROR RESPONSE");
  });
  return instance;
}

export default requestClient();
