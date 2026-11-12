import axiosInstance from './axiosConfig';
import inventarioMock from './mocks/inventario.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export async function getMateriales() {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(inventarioMock.data.materiales), 300));
  }
  const response = await axiosInstance.get('/inventario/materiales');
  return response.data.data;
}

export async function getBodegasProyecto() {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(inventarioMock.data.bodegasProyecto), 300));
  }
  const response = await axiosInstance.get('/inventario/bodegas-proyecto');
  return response.data.data;
}

export async function crearTraslado(data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
  }
  const response = await axiosInstance.post('/inventario/traslados', data);
  return response.data.data;
}