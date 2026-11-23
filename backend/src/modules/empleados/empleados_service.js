const AppError = require('../../utils/AppError');
const model = require('./empleados_model');

const TIPOS = ['ADMINISTRATIVO', 'CAMPO'];
const MODALIDADES = ['POR_DIA', 'DESTAJO'];
const DUI_REGEX = /^\d{8}-\d$/; // 12345678-9

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : valor);
const aNumero = (valor, porDefecto = 0) =>
  valor === undefined || valor === null || valor === '' ? porDefecto : Number(valor);
const aBooleano = (valor, porDefecto) =>
  valor === undefined ? porDefecto : valor === true || valor === 'true';

// Errores de PostgreSQL que sí son esperables al guardar un empleado
const traducirError = (error) => {
  if (error.code === '23505') return new AppError('Ya existe un empleado con ese DUI o código', 409);
  if (error.code === '23503') return new AppError('El proyecto asignado no existe', 400);
  return error;
};

// Limpia y deja el empleado con la forma exacta de la tabla
const normalizar = (entrada) => {
  const datos = {
    codigo_empleado: texto(entrada.codigo_empleado) || null,
    nombres: texto(entrada.nombres),
    apellidos: texto(entrada.apellidos),
    dui: texto(entrada.dui),
    cargo: texto(entrada.cargo),
    tipo_empleado: texto(entrada.tipo_empleado),
    modalidad_pago_campo: texto(entrada.modalidad_pago_campo) || null,
    es_ingeniero: aBooleano(entrada.es_ingeniero, false),
    salario_mensual: aNumero(entrada.salario_mensual),
    tarifa_campo: aNumero(entrada.tarifa_campo),
    proyecto_asignado_id: entrada.proyecto_asignado_id ? Number(entrada.proyecto_asignado_id) : null,
    activo: aBooleano(entrada.activo, true),
  };

  // El tipo define qué campos de pago aplican (la tabla tiene un CHECK que lo exige)
  if (datos.tipo_empleado === 'ADMINISTRATIVO') {
    datos.modalidad_pago_campo = null;
    datos.tarifa_campo = 0;
  } else if (datos.tipo_empleado === 'CAMPO') {
    datos.salario_mensual = 0;
  }
  return datos;
};

const validar = (d) => {
  const errores = [];

  if (!d.nombres) errores.push('nombres es obligatorio');
  if (!d.apellidos) errores.push('apellidos es obligatorio');
  if (!d.cargo) errores.push('cargo es obligatorio');
  if (!d.dui || !DUI_REGEX.test(d.dui)) errores.push('dui es obligatorio con formato 12345678-9');
  if (!TIPOS.includes(d.tipo_empleado)) errores.push(`tipo_empleado debe ser: ${TIPOS.join(', ')}`);

  if (d.tipo_empleado === 'ADMINISTRATIVO' && !(d.salario_mensual > 0)) {
    errores.push('salario_mensual debe ser mayor que 0 para personal administrativo');
  }
  if (d.tipo_empleado === 'CAMPO') {
    if (!MODALIDADES.includes(d.modalidad_pago_campo)) {
      errores.push(`modalidad_pago_campo debe ser: ${MODALIDADES.join(', ')}`);
    }
    if (!(d.tarifa_campo > 0)) errores.push('tarifa_campo debe ser mayor que 0 para personal de campo');
  }
  if (!Number.isFinite(d.salario_mensual) || d.salario_mensual < 0) errores.push('salario_mensual inválido');
  if (!Number.isFinite(d.tarifa_campo) || d.tarifa_campo < 0) errores.push('tarifa_campo inválida');
  if (d.proyecto_asignado_id !== null && !(Number.isInteger(d.proyecto_asignado_id) && d.proyecto_asignado_id > 0)) {
    errores.push('proyecto_asignado_id inválido');
  }

  if (errores.length) throw new AppError(errores.join('; '), 400);
};

const listar = async (query = {}) => {
  if (query.tipo && !TIPOS.includes(query.tipo)) {
    throw new AppError(`tipo debe ser: ${TIPOS.join(', ')}`, 400);
  }
  const activo = query.activo === undefined ? undefined : query.activo === 'true';
  return model.listar({ tipo: query.tipo, activo, busqueda: query.q });
};

const obtener = async (id) => {
  const empleado = await model.obtenerPorId(id);
  if (!empleado) throw new AppError('Empleado no encontrado', 404);
  return empleado;
};

const crear = async (entrada) => {
  const datos = normalizar(entrada);
  validar(datos);
  if (!datos.codigo_empleado) datos.codigo_empleado = await model.siguienteCodigo();

  try {
    return await model.crear(datos);
  } catch (error) {
    throw traducirError(error);
  }
};

const actualizar = async (id, entrada) => {
  const existente = await obtener(id);
  // PUT: lo que no se envía conserva el valor actual
  const datos = normalizar({ ...existente, ...entrada });
  validar(datos);

  try {
    return await model.actualizar(id, datos);
  } catch (error) {
    throw traducirError(error);
  }
};

const desactivar = async (id) => {
  await obtener(id);
  return model.desactivar(id);
};

module.exports = { listar, obtener, crear, actualizar, desactivar };
