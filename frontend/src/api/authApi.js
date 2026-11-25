import axiosInstance from './axiosConfig';
import authMock from './mocks/auth.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// credentials: { login, password } — login puede ser username o correo
export async function login(credentials) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(authMock.data), 300));
  }
  const response = await axiosInstance.post('/auth/login', {
    login: credentials.login,
    password: credentials.password,
  });
  return response.data.data;
}

// userData: { nombre_completo, username, correo, password, rol, empleado_id? }
export async function register(userData) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), username: userData.username, rol: userData.rol }), 300));
  }
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data.data;
}