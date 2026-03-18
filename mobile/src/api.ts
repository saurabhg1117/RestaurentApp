import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Render URL after deployment (e.g., https://restaurant-pos-api.onrender.com/api)
const API_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
