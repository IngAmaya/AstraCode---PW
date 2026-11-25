import axiosInstance from './axiosConfig';
import inventarioMock from './mocks/inventario.mock.json';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// --- Materiales ---

export async function getMateriales(busqueda) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(inventarioMock.data.materiales), 300));
  }
  const response = await axiosInstance.get('/inventario/materiales', { params: busqueda ? { busqueda } : {} });
  return response.data.data;
}

export async function getMaterialById(id) {
  if (useMock) {
    const found = inventarioMock.data.materiales.find((m) => m.id === Number(id));
    return new Promise((resolve) => setTimeout(() => resolve(found), 300));
  }
  const response = await axiosInstance.get(`/inventario/materiales/${id}`);
  return response.data.data;
}

// data: { codigo, nombre, unidad_medida, costo_unitario, stock_minimo }
export async function crearMaterial(data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
  }
  const response = await axiosInstance.post('/inventario/materiales', data);
  return response.data.data;
}

export async function actualizarMaterial(id, data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id, ...data }), 300));
  }
  const response = await axiosInstance.put(`/inventario/materiales/${id}`, data);
  return response.data.data;
}

// --- Bodegas ---

export async function getBodegas(tipo) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(inventarioMock.data.bodegas), 300));
  }
  const response = await axiosInstance.get('/inventario/bodegas', { params: tipo ? { tipo } : {} });
  return response.data.data;
}

export async function getStockDeBodega(bodegaId) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(inventarioMock.data.stockBodega), 300));
  }
  const response = await axiosInstance.get(`/inventario/bodegas/${bodegaId}/stock`);
  return response.data.data;
}

// --- Kardex (historial de movimientos) ---

export async function getKardex(filtros = {}) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  }
  const response = await axiosInstance.get('/inventario/kardex', { params: filtros });
  return response.data.data;
}

// --- Ingresos (compras a bodega central) ---

export async function getIngresos() {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve([]), 300));
  }
  const response = await axiosInstance.get('/inventario/ingresos');
  return response.data.data;
}

export async function getIngresoById(id) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(null), 300));
  }
  const response = await axiosInstance.get(`/inventario/ingresos/${id}`);
  return response.data.data;
}

// data: { bodega_id, proveedor, numero_documento?, responsable, observaciones?, detalles: [{ material_id, cantidad, costo_unitario }] }
export async function registrarIngreso(data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
  }
  const response = await axiosInstance.post('/inventario/ingresos', data);
  return response.data.data;
}

// --- Traslados (bodega central -> proyecto) ---

export async function getTraslados() {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(inventarioMock.data.traslados), 300));
  }
  const response = await axiosInstance.get('/inventario/traslados');
  return response.data.data;
}

export async function getTrasladoById(id) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve(null), 300));
  }
  const response = await axiosInstance.get(`/inventario/traslados/${id}`);
  return response.data.data;
}

// data: { bodega_origen_id, bodega_destino_id, responsable, observaciones?, detalles: [{ material_id, cantidad }] }
export async function registrarTraslado(data) {
  if (useMock) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: Date.now(), ...data }), 300));
  }
  const response = await axiosInstance.post('/inventario/traslados', data);
  return response.data.data;
}