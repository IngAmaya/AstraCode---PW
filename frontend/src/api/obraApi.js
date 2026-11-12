import axiosConfig from './axiosConfig.js';

export async function getAvances(id) {
  try {
    const response = await axiosConfig.get(id ? `/obra/avances/${id}` : '/obra/avances');
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createAvance(data) {
  try {
    const response = await axiosConfig.post('/obra/avances', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateAvance(id, data) {
  try {
    const response = await axiosConfig.put(`/obra/avances/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteAvance(id) {
  try {
    const response = await axiosConfig.delete(`/obra/avances/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
