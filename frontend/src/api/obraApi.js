import api from './axiosConfig.js';
const data = (r) => r.data.data;
export const getAvances = async (id) => data(await api.get(id ? `/obra/avances/${id}` : '/obra/avances'));
export const createAvance = async (body) => data(await api.post('/obra/avances', body));
export const getPartidas = async (params={}) => data(await api.get('/obra/partidas',{params}));
export const getPartida = async (id) => data(await api.get(`/obra/partidas/${id}`));
export const createPartida = async (body) => data(await api.post('/obra/partidas',body));
export const saveReceta = async (id,body) => data(await api.post(`/obra/partidas/${id}/receta`,body));
export const deleteReceta = async (id,rid) => data(await api.delete(`/obra/partidas/${id}/receta/${rid}`));
