import api from './axiosConfig.js';
import ventasMock from './mocks/ventas.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';
const data = (r) => r.data.data;

export const getClientes = async (id, params = {}) => {
  if (useMock) {
    if (id) {
      const found = ventasMock.data.clientes.find((c) => c.id === Number(id));
      return new Promise((resolve) => setTimeout(() => resolve(found), 300));
    }
    return new Promise((resolve) => setTimeout(() => resolve(ventasMock.data.clientes), 300));
  }
  return data(await api.get(id ? `/ventas/clientes/${id}` : '/ventas/clientes', { params }));
};

export const createCliente = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...body }), 300));
  return data(await api.post('/ventas/clientes', body));
};

export const updateCliente = async (id, body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id, ...body }), 300));
  return data(await api.put(`/ventas/clientes/${id}`, body));
};

export const deleteCliente = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 300));
  return data(await api.delete(`/ventas/clientes/${id}`));
};

export const changeClienteStatus = async (id, estado) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id, estado }), 300));
  return data(await api.patch(`/ventas/clientes/${id}/estado`, { estado_embudo: estado }));
};

export const getUnidades = async (params = {}) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  return data(await api.get('/ventas/unidades', { params }));
};

export const getVentas = async (params = {}) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  return data(await api.get('/ventas/contratos', { params }));
};

export const createVenta = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...body }), 300));
  return data(await api.post('/ventas/contratos', body));
};

export const getPlanesCliente = async (id) => {
  if (useMock) {
    const found = ventasMock.data.planesPago.find((p) => p.clienteId === Number(id));
    return new Promise((resolve) => setTimeout(() => resolve(found), 300));
  }
  return data(await api.get(`/ventas/plan-pagos/${id}`));
};

export const getPlanVenta = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve(null), 300));
  return data(await api.get(`/ventas/contratos/${id}/plan-pagos`));
};

export const createAbono = async (clienteId, body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), clienteId, ...body }), 300));
  return data(await api.post(clienteId ? `/ventas/abonos/${clienteId}` : '/ventas/abonos', body));
};

export const getFacturas = async (params = {}) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  return data(await api.get('/ventas/facturacion', { params }));
};

export const getFactura = async (id) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve(null), 300));
  return data(await api.get(`/ventas/facturacion/${id}`));
};