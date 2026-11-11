import axiosConfig from './axiosConfig.js';

export async function getMateriales(id) {
  try {
    const response = await axiosConfig.get(id ? `/inventario/materiales/${id}` : '/inventario/materiales');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createMaterial(data) {
  try {
    const response = await axiosConfig.post('/inventario/materiales', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateMaterial(id, data) {
  try {
    const response = await axiosConfig.put(`/inventario/materiales/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteMaterial(id) {
  try {
    const response = await axiosConfig.delete(`/inventario/materiales/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
