import api from './axiosConfig.js';
import rrhhMock from './mocks/rrhh.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';
const data = (r) => r.data.data;

export const getEmpleados = async (id, params = {}) => {
  if (useMock) {
    if (id) {
      const found = rrhhMock.data.empleados.find((e) => e.id === Number(id));
      return new Promise((resolve) => setTimeout(() => resolve(found), 300));
    }
    return new Promise((resolve) => setTimeout(() => resolve(rrhhMock.data.empleados), 300));
  }
  return data(await api.get(id ? `/rrhh/empleados/${id}` : '/rrhh/empleados', { params }));
};

export const createEmpleado = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...body }), 300));
  return data(await api.post('/rrhh/empleados', body));
};

export const updateEmpleado = async (id, body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id, ...body }), 300));
  return data(await api.put(`/rrhh/empleados/${id}`, body));
};

export const deleteEmpleado = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 300));
  return data(await api.delete(`/rrhh/empleados/${id}`));
};

export const getPlanillas = async (params = {}) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  return data(await api.get('/rrhh/planilla', { params }));
};

export const getPlanilla = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve(null), 300));
  return data(await api.get(`/rrhh/planilla/${id}`));
};

export const previewPlanilla = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  return data(await api.post('/rrhh/planilla/calcular', body));
};

export const createPlanilla = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...body }), 300));
  return data(await api.post('/rrhh/planilla', body));
};

export const changePlanillaStatus = async (id, estado) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id, estado }), 300));
  return data(await api.patch(`/rrhh/planilla/${id}/estado`, { estado }));
};

export const deletePlanilla = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 300));
  return data(await api.delete(`/rrhh/planilla/${id}`));
};

export const getBoleta = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve(null), 300));
  return data(await api.get(`/rrhh/planilla/boletas/${id}`));
};

export const getBoletasEmpleado = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  return data(await api.get(`/rrhh/planilla/empleado/${id}/boletas`));
};