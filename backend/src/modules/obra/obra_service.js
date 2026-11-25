const AppError = require('../../utils/AppError');
const model = require('./obra_model');

const FASES = ['TERRACERIA', 'OBRA_GRIS', 'ACABADOS'];

const entero  = (v, n) => { const x = Number(v); if (!Number.isInteger(x) || x <= 0) throw new AppError(`${n} debe ser un entero positivo`, 400); return x; };
const positivo = (v, n) => { const x = Number(v); if (!Number.isFinite(x) || x <= 0) throw new AppError(`${n} debe ser mayor que 0`, 400); return x; };

// ---- Partidas ---------------------------------------------------------------

const listarPartidas = (query = {}) => {
  if (query.fase && !FASES.includes(query.fase))
    throw new AppError(`fase debe ser: ${FASES.join(', ')}`, 400);
  return model.listarPartidas({
    proyectoId: query.proyecto_id ? Number(query.proyecto_id) : undefined,
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
  await model.eliminarRecetaItem(recetaId);
};

// ---- Avances ----------------------------------------------------------------

const listarAvances = (query = {}) => model.listarAvances({
  partidaId:   query.partida_id   ? Number(query.partida_id)   : undefined,
  ingenieroId: query.ingeniero_id ? Number(query.ingeniero_id) : undefined,
});

const obtenerAvance = async (id) => {
  const avance = await model.obtenerAvance(id);
  if (!avance) throw new AppError('Reporte de avance no encontrado', 404);
  const consumos = await model.consumosDeAvance(id);
  return { ...avance, consumos };
};

const registrarAvance = async (entrada) => {
  const errores = [];
  if (!entrada.partida_id)     errores.push('partida_id es obligatorio');
  if (!entrada.ingeniero_id)   errores.push('ingeniero_id es obligatorio');
  if (entrada.porcentaje_nuevo === undefined) errores.push('porcentaje_nuevo es obligatorio');
  if (errores.length) throw new AppError(errores.join('; '), 400);

  const pct = Number(entrada.porcentaje_nuevo);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100)
    throw new AppError('porcentaje_nuevo debe estar entre 1 y 100', 400);

  // El porcentaje_anterior se toma de la partida actual para garantizar consistencia
  const partida = await model.obtenerPartida(entero(entrada.partida_id, 'partida_id'));
  if (!partida) throw new AppError('Partida no encontrada', 404);

  if (pct <= Number(partida.porcentaje_avance))
    throw new AppError(`porcentaje_nuevo (${pct}) debe ser mayor que el avance actual (${partida.porcentaje_avance})`, 400);

  try {
    const id = await model.registrarAvance({
      partida_id:          partida.id,
      ingeniero_id:        entero(entrada.ingeniero_id, 'ingeniero_id'),
      porcentaje_anterior: Number(partida.porcentaje_avance),
      porcentaje_nuevo:    pct,
      observaciones:       entrada.observaciones ? String(entrada.observaciones).trim() : null,
    });
    return obtenerAvance(id);
  } catch (err) {
    // Triggers lanzan P0001 con mensajes claros (stock insuficiente, proyecto no EN_EJECUCION, etc.)
    if (err.code === 'P0001') throw new AppError(err.message, 409);
    throw err;
  }
};

module.exports = {
  listarPartidas, obtenerPartida, crearPartida,
  actualizarRecetaItem, eliminarRecetaItem,
  listarAvances, obtenerAvance, registrarAvance,
};