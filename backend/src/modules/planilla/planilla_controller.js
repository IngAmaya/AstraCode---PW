const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const service = require('./planilla_service');

const leerId = (valor) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('El id debe ser un entero positivo', 400);
  return id;
};

const listar = asyncHandler(async (req, res) => {
  const data = await service.listar(req.query);
  res.json({ ok: true, data });
});

const obtener = asyncHandler(async (req, res) => {
  const data = await service.obtener(leerId(req.params.id));
  res.json({ ok: true, data });
});

const vistaPrevia = asyncHandler(async (req, res) => {
  const data = await service.vistaPrevia(req.body);
  res.json({ ok: true, data });
});

const crear = asyncHandler(async (req, res) => {
  const data = await service.crear(req.body);
  res.status(201).json({ ok: true, data });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const data = await service.cambiarEstado(leerId(req.params.id), req.body.estado);
  res.json({ ok: true, data });
});

const eliminar = asyncHandler(async (req, res) => {
  await service.eliminar(leerId(req.params.id));
  res.json({ ok: true, message: 'Planilla eliminada' });
});

const obtenerBoleta = asyncHandler(async (req, res) => {
  const data = await service.obtenerBoleta(leerId(req.params.id));
  res.json({ ok: true, data });
});

const boletasDeEmpleado = asyncHandler(async (req, res) => {
  const data = await service.boletasDeEmpleado(leerId(req.params.empleadoId));
  res.json({ ok: true, data });
});

module.exports = {
  listar, obtener, vistaPrevia, crear, cambiarEstado, eliminar, obtenerBoleta, boletasDeEmpleado,
};
