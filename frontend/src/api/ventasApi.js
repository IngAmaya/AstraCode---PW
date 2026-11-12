import axiosConfig from './axiosConfig.js';

export async function getClientes(id) {
  try {
    const response = await axiosConfig.get(id ? `/ventas/clientes/${id}` : '/ventas/clientes');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createCliente(data) {
  try {
    const response = await axiosConfig.post('/ventas/clientes', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateCliente(id, data) {
  try {
    const response = await axiosConfig.put(`/ventas/clientes/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteCliente(id) {
  try {
    const response = await axiosConfig.delete(`/ventas/clientes/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
