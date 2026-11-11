import axiosConfig from './axiosConfig.js';

export async function getProyectos(id) {
  try {
    const response = await axiosConfig.get(id ? `/proyectos/${id}` : '/proyectos');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createProyecto(data) {
  try {
    const response = await axiosConfig.post('/proyectos', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateProyecto(id, data) {
  try {
    const response = await axiosConfig.put(`/proyectos/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteProyecto(id) {
  try {
    const response = await axiosConfig.delete(`/proyectos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
