const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const service = require('./facturacion_service');

const leerId = (valor) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('El id debe ser un entero positivo', 400);
  return id;
};

const registrarAbono = asyncHandler(async (req, res) => {
  const clienteId = req.params.clienteId ? leerId(req.params.clienteId) : undefined;
  const data = await service.registrarAbono(req.body, clienteId);
  res.status(201).json({ ok: true, data });
});

const listar = asyncHandler(async (req, res) => {
  const data = await service.listar(req.query);
  res.json({ ok: true, data });
});

const obtener = asyncHandler(async (req, res) => {
  const data = await service.obtener(leerId(req.params.id));
  res.json({ ok: true, data });
});

module.exports = { registrarAbono, listar, obtener };
