import axiosConfig from './axiosConfig.js';

export async function getEmpleados(id) {
  try {
    const response = await axiosConfig.get(id ? `/rrhh/empleados/${id}` : '/rrhh/empleados');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createEmpleado(data) {
  try {
    const response = await axiosConfig.post('/rrhh/empleados', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateEmpleado(id, data) {
  try {
    const response = await axiosConfig.put(`/rrhh/empleados/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteEmpleado(id) {
  try {
    const response = await axiosConfig.delete(`/rrhh/empleados/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
