const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const service = require('./ventas_service');

const leerId = (valor) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('El id debe ser un entero positivo', 400);
  return id;
};

const listarUnidades = asyncHandler(async (req, res) => {
  const data = await service.listarUnidades(req.query);
  res.json({ ok: true, data });
});

const listarVentas = asyncHandler(async (req, res) => {
  const data = await service.listarVentas(req.query);
  res.json({ ok: true, data });
});

const obtenerVenta = asyncHandler(async (req, res) => {
  const data = await service.obtenerVenta(leerId(req.params.id));
  res.json({ ok: true, data });
});

const crearVenta = asyncHandler(async (req, res) => {
  const data = await service.crearVenta(req.body);
  res.status(201).json({ ok: true, data });
});

const planDeVenta = asyncHandler(async (req, res) => {
  const data = await service.planDeVenta(leerId(req.params.id));
  res.json({ ok: true, data });
});

const planesDeCliente = asyncHandler(async (req, res) => {
  const data = await service.planesDeCliente(leerId(req.params.clienteId));
  res.json({ ok: true, data });
});

module.exports = { listarUnidades, listarVentas, obtenerVenta, crearVenta, planDeVenta, planesDeCliente };
