import axiosInstance from './axiosConfig';
import authMock from './mocks/auth.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export async function login(credentials) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(authMock.data), 300));
  }
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data.data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

export async function register(userData) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(authMock.data), 300));
  }
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data.data;
  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
}