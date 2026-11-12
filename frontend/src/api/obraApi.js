import axiosInstance from './axiosConfig';
import obraMock from './mocks/obra.mock.json';
const useMock = import.meta.env.VITE_USE_MOCK === 'true';
export async function getAvances() {
 if (useMock) {
 return new Promise((resolve) => setTimeout(() => resolve(obraMock.data.avances), 300));
 }
 const response = await axiosInstance.get('/obra/avances');
 return response.data.data;
}
export async function crearAvance(data) {
 if (useMock) {
 return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
 }
 const response = await axiosInstance.post('/obra/avances', data);
 return response.data.data;
}
export async function getPartidas() {
 if (useMock) {
 return new Promise((resolve) => setTimeout(() => resolve(obraMock.data.partidas), 300));
 }
 const response = await axiosInstance.get('/obra/partidas');
 return response.data.data;
}