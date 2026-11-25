import api from './axiosConfig.js';
import obraMock from './mocks/obra.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';
const data = (r) => r.data.data;

export const getAvances = async (id) => {
  if (useMock) {
    if (id) {
      const found = obraMock.data.avances.find((a) => a.id === Number(id));
      return new Promise((resolve) => setTimeout(() => resolve(found), 300));
    }
    return new Promise((resolve) => setTimeout(() => resolve(obraMock.data.avances), 300));
  }
  return data(await api.get(id ? `/obra/avances/${id}` : '/obra/avances'));
};

export const createAvance = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...body }), 300));
  return data(await api.post('/obra/avances', body));
};

export const getPartidas = async (params = {}) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve(obraMock.data.partidas), 300));
  return data(await api.get('/obra/partidas', { params }));
};

export const getPartida = async (id) => {
  if (useMock) {
    const found = obraMock.data.partidas.find((p) => p.id === Number(id));
    return new Promise((resolve) => setTimeout(() => resolve(found), 300));
  }
  return data(await api.get(`/obra/partidas/${id}`));
};

export const createPartida = async (body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...body }), 300));
  return data(await api.post('/obra/partidas', body));
};

export const saveReceta = async (id, body) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 300));
  return data(await api.post(`/obra/partidas/${id}/receta`, body));
};

export const deleteReceta = async (id, rid) => {
  if (useMock) return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 300));
  return data(await api.delete(`/obra/partidas/${id}/receta/${rid}`));
};