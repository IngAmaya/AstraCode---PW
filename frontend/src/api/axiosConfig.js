import axios from 'axios';

const axiosConfig = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL,
});

export default axiosConfig;
