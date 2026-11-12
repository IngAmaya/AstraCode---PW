import axiosInstance from './axiosConfig';
import proyectosMock from './mocks/proyectos.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export async function getProyectos() {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(proyectosMock.data), 300));
  }
  const response = await axiosInstance.get('/proyectos');
  return response.data.data;
}

export async function getProyectoById(id) {
  if (useMock) {
    const found = proyectosMock.data.find((p) => p.id === Number(id));
    return new Promise((resolve) => setTimeout(() => resolve(found), 300));
  }
  const response = await axiosInstance.get(`/proyectos/${id}`);
  return response.data.data;
}

export async function createProyecto(data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
  }
  const response = await axiosInstance.post('/proyectos', data);
  return response.data.data;
}

export async function updatePermisos(id, permisos) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id, permisos }), 300));
  }
  const response = await axiosInstance.put(`/proyectos/${id}/permisos`, permisos);
  return response.data.data;
}