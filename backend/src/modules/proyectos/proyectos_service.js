const AppError = require('../../utils/AppError');
const model = require('./proyectos_model');

const TIPOS = ['CASAS_SERIE', 'APARTAMENTOS'];
const FASES = ['DISENO', 'TERRACERIA', 'OBRA_GRIS', 'ACABADOS', 'FINALIZADO'];
const ESTADOS = ['PLANIFICACION', 'EN_EJECUCION', 'SUSPENDIDO', 'FINALIZADO'];
const ENTIDADES = ['OPAMSS', 'MARN', 'ANDA'];
const ESTADOS_PERMISO = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO'];
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() || null : valor ?? null);
const fechaValida = (valor) => {
  if (typeof valor !== 'string' || !FECHA_REGEX.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  // Una fecha imposible (2026-13-45) da Invalid Date: toISOString() lanzaría excepción y respondería 500
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

// Errores de los triggers de la BD (bloqueo de permisología): son reglas de negocio, no fallos
const traducirError = (error) => {
  if (error.code === 'P0001') return new AppError(error.message, 409);
  if (error.code === '23514') return new AppError('Alguno de los valores enviados no es válido', 400);
  return error;
};

// Agrega el resumen de permisos que usa el frontend: { opamss: true, marn: false, anda: false }
const conPermisos = async (proyecto) => {
  const permisos = await model.permisosDeProyecto(proyecto.id);
  const mapa = {};
  for (const p of permisos) mapa[p.entidad.toLowerCase()] = p.estado === 'APROBADO';
  return {
    ...proyecto,
    puede_iniciar_obra: proyecto.permisos_aprobados === ENTIDADES.length,
    permisos: mapa,
    permisos_detalle: permisos,
  };
};

// ---- Proyectos ---------------------------------------------------------------------

const normalizar = (e) => ({
  nombre: texto(e.nombre),
  tipo_proyecto: texto(e.tipo_proyecto),
  ubicacion: texto(e.ubicacion),
  presupuesto_total:
    e.presupuesto_total === undefined || e.presupuesto_total === null || e.presupuesto_total === ''
      ? 0
      : Number(e.presupuesto_total),
  fecha_inicio_estimada: texto(e.fecha_inicio_estimada),
});

const validar = (d) => {
  const errores = [];
  if (!d.nombre) errores.push('nombre es obligatorio');
  else if (d.nombre.length > 150) errores.push('nombre no puede exceder 150 caracteres');
  if (!TIPOS.includes(d.tipo_proyecto)) errores.push(`tipo_proyecto debe ser: ${TIPOS.join(', ')}`);
  if (!d.ubicacion) errores.push('ubicacion es obligatoria');
  if (!Number.isFinite(d.presupuesto_total) || d.presupuesto_total < 0) errores.push('presupuesto_total inválido');
  if (d.fecha_inicio_estimada && !fechaValida(d.fecha_inicio_estimada)) {
    errores.push('fecha_inicio_estimada inválida (use AAAA-MM-DD)');
  }
  if (errores.length) throw new AppError(errores.join('; '), 400);
};

const listar = async (query = {}) => {
  if (query.estado && !ESTADOS.includes(query.estado)) throw new AppError(`estado debe ser: ${ESTADOS.join(', ')}`, 400);
  if (query.fase && !FASES.includes(query.fase)) throw new AppError(`fase debe ser: ${FASES.join(', ')}`, 400);
  if (query.tipo && !TIPOS.includes(query.tipo)) throw new AppError(`tipo debe ser: ${TIPOS.join(', ')}`, 400);

  const proyectos = await model.listar({ estado: query.estado, fase: query.fase, tipo: query.tipo, busqueda: query.q });
  return Promise.all(proyectos.map(conPermisos));
};

const obtenerBase = async (id) => {
  const proyecto = await model.obtenerPorId(id);
  if (!proyecto) throw new AppError('Proyecto no encontrado', 404);
  return proyecto;
};

const obtener = async (id) => conPermisos(await obtenerBase(id));

const crear = async (entrada) => {
  const datos = normalizar(entrada);
  validar(datos);
  try {
    const id = await model.crear(datos);
    return obtener(id);
  } catch (error) {
    throw traducirError(error);
  }
};

const actualizar = async (id, entrada) => {
  const existente = await obtenerBase(id);
  // PUT: lo que no se envía conserva el valor actual
  const datos = normalizar({ ...existente, ...entrada });
  validar(datos);
  try {
    await model.actualizar(id, datos);
    return obtener(id);
  } catch (error) {
    throw traducirError(error);
  }
};

// Cambia la fase y/o el estado. Para salir de DISENO o pasar a EN_EJECUCION se exigen los 3 permisos
const cambiarEstado = async (id, entrada) => {
  const existente = await obtenerBase(id);
  const fase = entrada.fase_actual || existente.fase_actual;
  const estado = entrada.estado || existente.estado;

  if (!entrada.fase_actual && !entrada.estado) throw new AppError('Indique fase_actual y/o estado', 400);
  if (!FASES.includes(fase)) throw new AppError(`fase_actual debe ser: ${FASES.join(', ')}`, 400);
  if (!ESTADOS.includes(estado)) throw new AppError(`estado debe ser: ${ESTADOS.join(', ')}`, 400);

  try {
    await model.cambiarFaseYEstado(id, fase, estado);
  } catch (error) {
    throw traducirError(error);
  }
  return obtener(id);
};

// ---- Permisos ----------------------------------------------------------------------

// Acepta dos formatos:
//   { "opamss": true, "marn": false, "anda": true }          (lo que envía el frontend)
//   { "permisos": [{ "entidad": "MARN", "estado": "EN_REVISION", "numero_resolucion": "..." }] }
const interpretarPermisos = (entrada, actuales) => {
  if (Array.isArray(entrada.permisos)) {
    return entrada.permisos.map((p) => {
      const entidad = texto(p.entidad)?.toUpperCase();
      const estado = texto(p.estado)?.toUpperCase();
      if (!ENTIDADES.includes(entidad)) throw new AppError(`entidad debe ser: ${ENTIDADES.join(', ')}`, 400);
      if (!ESTADOS_PERMISO.includes(estado)) throw new AppError(`estado debe ser: ${ESTADOS_PERMISO.join(', ')}`, 400);
      if (p.fecha_aprobacion && !fechaValida(p.fecha_aprobacion)) {
        throw new AppError('fecha_aprobacion inválida (use AAAA-MM-DD)', 400);
      }
      return {
        entidad,
        estado,
        numero_resolucion: texto(p.numero_resolucion),
        observaciones: texto(p.observaciones),
        fecha_aprobacion: texto(p.fecha_aprobacion),
      };
    });
  }

  const resultado = [];
  for (const entidad of ENTIDADES) {
    const valor = entrada[entidad.toLowerCase()];
    if (valor === undefined) continue;
    if (typeof valor !== 'boolean') throw new AppError(`${entidad.toLowerCase()} debe ser true o false`, 400);
    const actual = actuales.find((p) => p.entidad === entidad) || { estado: 'PENDIENTE', numero_resolucion: null, observaciones: null, fecha_aprobacion: null };
    // true aprueba; false solo quita la aprobación (no pisa un EN_REVISION o RECHAZADO)
    const estado = valor ? 'APROBADO' : actual.estado === 'APROBADO' ? 'PENDIENTE' : actual.estado;
    resultado.push({
      entidad,
      estado,
      numero_resolucion: actual.numero_resolucion,
      observaciones: actual.observaciones,
      fecha_aprobacion: actual.fecha_aprobacion,
    });
  }
  return resultado;
};

const actualizarPermisos = async (id, entrada) => {
  await obtenerBase(id);
  const actuales = await model.permisosDeProyecto(id);
  const cambios = interpretarPermisos(entrada || {}, actuales);
  if (!cambios.length) throw new AppError('No se indicó ningún permiso para actualizar', 400);

  try {
    await model.actualizarPermisos(id, cambios);
  } catch (error) {
    throw traducirError(error);
  }
  return obtener(id);
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, actualizarPermisos };