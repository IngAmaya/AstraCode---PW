const AppError = require('../../utils/AppError');
const { ROLES } = require('../../utils/constants');
const model = require('./obra_model');

const FASES = ['TERRACERIA', 'OBRA_GRIS', 'ACABADOS'];

const entero  = (v, n) => { const x = Number(v); if (!Number.isInteger(x) || x <= 0) throw new AppError(`${n} debe ser un entero positivo`, 400); return x; };
const positivo = (v, n) => { const x = Number(v); if (!Number.isFinite(x) || x <= 0) throw new AppError(`${n} debe ser mayor que 0`, 400); return x; };

// ---- Partidas ---------------------------------------------------------------

const listarPartidas = (query = {}) => {
  if (query.fase && !FASES.includes(query.fase))
    throw new AppError(`fase debe ser: ${FASES.join(', ')}`, 400);
  return model.listarPartidas({
    proyectoId: query.proyecto_id !== undefined ? entero(query.proyecto_id, 'proyecto_id') : undefined,
    fase: query.fase,
  });
};

const obtenerPartida = async (id) => {
  const partida = await model.obtenerPartida(id);
  if (!partida) throw new AppError('Partida no encontrada', 404);
  const receta = await model.recetaDePartida(id);
  return { ...partida, receta };
};

const crearPartida = async (entrada) => {
  const errores = [];
  if (!entrada.proyecto_id)   errores.push('proyecto_id es obligatorio');
  if (!FASES.includes(entrada.fase)) errores.push(`fase debe ser: ${FASES.join(', ')}`);
  if (!entrada.codigo_partida) errores.push('codigo_partida es obligatorio');
  if (!entrada.nombre)         errores.push('nombre es obligatorio');
  if (errores.length) throw new AppError(errores.join('; '), 400);

  try {
    const id = await model.crearPartida({
      proyecto_id:    entero(entrada.proyecto_id, 'proyecto_id'),
      fase:           entrada.fase,
      codigo_partida: String(entrada.codigo_partida).trim().toUpperCase(),
      nombre:         String(entrada.nombre).trim(),
    });
    return obtenerPartida(id);
  } catch (err) {
    if (err.code === '23505') throw new AppError('Ya existe una partida con ese código en este proyecto', 409);
    if (err.code === '23503') throw new AppError('El proyecto no existe', 404);
    throw err;
  }
};

// ---- Receta -----------------------------------------------------------------

const actualizarRecetaItem = async (partidaId, entrada) => {
  await obtenerPartida(partidaId);
  const materialId = entero(entrada.material_id, 'material_id');
  const cantidad   = positivo(entrada.cantidad_total_requerida, 'cantidad_total_requerida');
  try {
    await model.upsertReceta(partidaId, materialId, cantidad);
    return model.recetaDePartida(partidaId);
  } catch (err) {
    if (err.code === '23503') throw new AppError('El material no existe', 404);
    throw err;
  }
};

const eliminarRecetaItem = async (partidaId, recetaId) => {
  await obtenerPartida(partidaId);
  const eliminado = await model.eliminarRecetaItem(partidaId, recetaId);
  if (!eliminado) throw new AppError('El item de receta no existe en esta partida', 404);
};

// ---- Avances ----------------------------------------------------------------

const listarAvances = (query = {}) => model.listarAvances({
  partidaId:   query.partida_id   !== undefined ? entero(query.partida_id, 'partida_id')     : undefined,
  ingenieroId: query.ingeniero_id !== undefined ? entero(query.ingeniero_id, 'ingeniero_id') : undefined,
});

const obtenerAvance = async (id) => {
  const avance = await model.obtenerAvance(id);
  if (!avance) throw new AppError('Reporte de avance no encontrado', 404);
  const consumos = await model.consumosDeAvance(id);
  return { ...avance, consumos };
};

// Define quién firma el avance:
//  - INGENIERO_RESIDENTE: siempre es su propio empleado (el body se ignora, no puede suplantar a otro)
//  - ADMIN / GERENTE_PROYECTO: deben indicar ingeniero_id y debe ser un ingeniero activo
const resolverIngeniero = async (usuario, entrada) => {
  let empleadoId;
  if (usuario.rol === ROLES.INGENIERO) {
    empleadoId = await model.empleadoDeUsuario(usuario.id);
    if (!empleadoId) throw new AppError('Su usuario no está vinculado a un empleado ingeniero', 403);
  } else {
    if (!entrada.ingeniero_id) throw new AppError('ingeniero_id es obligatorio', 400);
    empleadoId = entero(entrada.ingeniero_id, 'ingeniero_id');
  }

  const empleado = await model.obtenerEmpleado(empleadoId);
  if (!empleado) throw new AppError('El ingeniero indicado no existe', 404);
  if (!empleado.es_ingeniero || !empleado.activo) {
    throw new AppError('El empleado no es un ingeniero activo con permiso para reportar avances', 400);
  }
  return empleadoId;
};

const registrarAvance = async (entrada, usuario) => {
  const errores = [];
  if (!entrada.partida_id)     errores.push('partida_id es obligatorio');
  if (entrada.porcentaje_nuevo === undefined) errores.push('porcentaje_nuevo es obligatorio');
  if (errores.length) throw new AppError(errores.join('; '), 400);

  const pct = Number(entrada.porcentaje_nuevo);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100)
    throw new AppError('porcentaje_nuevo debe estar entre 1 y 100', 400);

  const ingenieroId = await resolverIngeniero(usuario, entrada);

  // El porcentaje_anterior se toma de la partida actual para garantizar consistencia
  const partida = await model.obtenerPartida(entero(entrada.partida_id, 'partida_id'));
  if (!partida) throw new AppError('Partida no encontrada', 404);

  if (pct <= Number(partida.porcentaje_avance))
    throw new AppError(`porcentaje_nuevo (${pct}) debe ser mayor que el avance actual (${partida.porcentaje_avance})`, 400);

  try {
    const id = await model.registrarAvance({
      partida_id:          partida.id,
      ingeniero_id:        ingenieroId,
      porcentaje_anterior: Number(partida.porcentaje_avance),
      porcentaje_nuevo:    pct,
      observaciones:       entrada.observaciones ? String(entrada.observaciones).trim() : null,
    });
    return obtenerAvance(id);
  } catch (err) {
    // Triggers lanzan P0001 con mensajes claros (stock insuficiente, proyecto no EN_EJECUCION, etc.)
    if (err.code === 'P0001') throw new AppError(err.message, 409);
    if (err.code === '23503') throw new AppError('La partida o el ingeniero indicado no existe', 404);
    if (err.code === '23514') throw new AppError('porcentaje_nuevo debe ser mayor que el anterior y no exceder 100', 400);
    throw err;
  }
};

module.exports = {
  listarPartidas, obtenerPartida, crearPartida,
  actualizarRecetaItem, eliminarRecetaItem,
  listarAvances, obtenerAvance, registrarAvance,
};