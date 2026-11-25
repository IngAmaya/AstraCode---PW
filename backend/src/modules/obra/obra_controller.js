const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const service = require('./obra_service');

const leerId = (v) => { const id = Number(v); if (!Number.isInteger(id) || id <= 0) throw new AppError('El id debe ser un entero positivo', 400); return id; };

const listarPartidas    = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarPartidas(req.query) }));
const obtenerPartida    = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.obtenerPartida(leerId(req.params.id)) }));
const crearPartida      = asyncHandler(async (req, res) => res.status(201).json({ ok: true, data: await service.crearPartida(req.body) }));

const actualizarRecetaItem = asyncHandler(async (req, res) => {
  const data = await service.actualizarRecetaItem(leerId(req.params.id), req.body);
  res.json({ ok: true, data });
});
const eliminarRecetaItem = asyncHandler(async (req, res) => {
  await service.eliminarRecetaItem(leerId(req.params.id), leerId(req.params.recetaId));
  res.json({ ok: true, message: 'Item de receta eliminado' });
});

const listarAvances    = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarAvances(req.query) }));
const obtenerAvance    = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.obtenerAvance(leerId(req.params.id)) }));
const registrarAvance  = asyncHandler(async (req, res) => res.status(201).json({ ok: true, data: await service.registrarAvance(req.body) }));

module.exports = {
  listarPartidas, obtenerPartida, crearPartida,
  actualizarRecetaItem, eliminarRecetaItem,
  listarAvances, obtenerAvance, registrarAvance,
};