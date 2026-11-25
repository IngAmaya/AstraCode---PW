const AppError = require('../../utils/AppError');
const model = require('./clientes_model');

const ESTADOS = ['PROSPECTO', 'CONTACTADO', 'VISITA_AGENDADA', 'COTIZADO', 'CERRADO_GANADO', 'DESCARTADO'];
const DUI_REGEX = /^\d{8}-\d$/;                    // 12345678-9
const NIT_REGEX = /^\d{4}-\d{6}-\d{3}-\d$/;        // 0614-150490-102-3
const CORREO_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() || null : valor ?? null);
const aEntero = (valor) => (valor === undefined || valor === null || valor === '' ? null : Number(valor));

const traducirError = (error) => {
  if (error.code === '23505') return new AppError('Ya existe un cliente con ese DUI', 409);
  if (error.code === '23503') return new AppError('El asesor o el proyecto de interés no existe', 400);
  return error;
};

const normalizar = (e) => ({
  nombres: texto(e.nombres),
  apellidos: texto(e.apellidos),
  dui: texto(e.dui),
  nit: texto(e.nit),
  nrc: texto(e.nrc),
  giro_economico: texto(e.giro_economico),
  telefono: texto(e.telefono),
  correo: texto(e.correo),
  estado_embudo: texto(e.estado_embudo) || 'PROSPECTO',
  proyecto_interes_id: aEntero(e.proyecto_interes_id),
  asesor_id: aEntero(e.asesor_id),
  notas_seguimiento: texto(e.notas_seguimiento),
});

const validar = (d) => {
  const errores = [];
  if (!d.nombres) errores.push('nombres es obligatorio');
  if (!d.apellidos) errores.push('apellidos es obligatorio');
  if (!d.telefono) errores.push('telefono es obligatorio');
  if (d.dui && !DUI_REGEX.test(d.dui)) errores.push('dui inválido (formato 12345678-9)');
  if (d.nit && !NIT_REGEX.test(d.nit)) errores.push('nit inválido (formato 0614-150490-102-3)');
  if (d.correo && !CORREO_REGEX.test(d.correo)) errores.push('correo inválido');
  if (!ESTADOS.includes(d.estado_embudo)) errores.push(`estado_embudo debe ser: ${ESTADOS.join(', ')}`);
  for (const campo of ['proyecto_interes_id', 'asesor_id']) {
    if (d[campo] !== null && !(Number.isInteger(d[campo]) && d[campo] > 0)) errores.push(`${campo} inválido`);
  }
  if (errores.length) throw new AppError(errores.join('; '), 400);
};

const listar = async (query = {}) => {
  if (query.estado && !ESTADOS.includes(query.estado)) {
    throw new AppError(`estado debe ser: ${ESTADOS.join(', ')}`, 400);
  }
  return model.listar({
    estado: query.estado,
    asesorId: (() => {
      if (query.asesor_id === undefined || query.asesor_id === '') return undefined;
      const n = Number(query.asesor_id);
      if (!Number.isInteger(n) || n <= 0) throw new AppError('asesor_id debe ser un entero positivo', 400);
      return n;
    })(),
    busqueda: query.q,
  });
};

const obtener = async (id) => {
  const cliente = await model.obtenerPorId(id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);
  return cliente;
};

const crear = async (entrada) => {
  const datos = normalizar(entrada);
  validar(datos);
  try {
    const id = await model.crear(datos);
    return model.obtenerPorId(id);
  } catch (error) {
    throw traducirError(error);
  }
};

const actualizar = async (id, entrada) => {
  const existente = await obtener(id);
  const datos = normalizar({ ...existente, ...entrada });
  validar(datos);
  try {
    await model.actualizar(id, datos);
    return model.obtenerPorId(id);
  } catch (error) {
    throw traducirError(error);
  }
};

const cambiarEstado = async (id, estado) => {
  await obtener(id);
  if (!ESTADOS.includes(estado)) throw new AppError(`estado debe ser: ${ESTADOS.join(', ')}`, 400);
  await model.cambiarEstado(id, estado);
  return model.obtenerPorId(id);
};

const eliminar = async (id) => {
  await obtener(id);
  try {
    await model.eliminar(id);
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError('El cliente tiene ventas asociadas; márquelo como DESCARTADO en lugar de eliminarlo', 409);
    }
    throw error;
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar };
