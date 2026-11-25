import axiosInstance from './axiosConfig';
import proyectosMock from './mocks/proyectos.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export async function getProyectos(filtros = {}) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(proyectosMock.data), 300));
  }
  const response = await axiosInstance.get('/proyectos', { params: filtros });
  return response.data.data;
}

export async function getProyectoById(id) {
  if (useMock) {
    const found = proyectosMock.data.find((p) => p.id === Number(id));
    return new Promise((resolve) => setTimeout(() => resolve(found), 300));
  }
  const response = await axiosInstance.get(`/proyectos/${id}`);
  return response.data.data;
}

// data: { nombre, tipo_proyecto, ubicacion, presupuesto_total, fecha_inicio_estimada }
export async function crearProyecto(data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
  }
  const response = await axiosInstance.post('/proyectos', data);
  return response.data.data;
}

export async function actualizarProyecto(id, data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id, ...data }), 300));
  }
  const response = await axiosInstance.put(`/proyectos/${id}`, data);
  return response.data.data;
}

// data: { fase_actual?, estado? }
export async function cambiarEstadoProyecto(id, data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id, ...data }), 300));
  }
  const response = await axiosInstance.patch(`/proyectos/${id}/estado`, data);
  return response.data.data;
}

// data: { opamss, marn, anda } booleanos
export async function actualizarPermisos(id, data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id, permisos: data }), 300));
  }
  const response = await axiosInstance.put(`/proyectos/${id}/permisos`, data);
  return response.data.data;
}