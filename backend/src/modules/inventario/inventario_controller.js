const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const service = require('./inventario_service');

const leerId = (v) => {
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('El id debe ser un entero positivo', 400);
  return id;
};

// Materiales
const listarMateriales   = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarMateriales(req.query) }));
const obtenerMaterial    = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.obtenerMaterial(leerId(req.params.id)) }));
const crearMaterial      = asyncHandler(async (req, res) => res.status(201).json({ ok: true, data: await service.crearMaterial(req.body) }));
const actualizarMaterial = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.actualizarMaterial(leerId(req.params.id), req.body) }));

// Bodegas
const listarBodegas  = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarBodegas(req.query) }));
const stockDeBodega  = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.stockDeBodega(leerId(req.params.id)) }));

// Kardex
const listarKardex = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarKardex(req.query) }));

// Ingresos
const registrarIngreso = asyncHandler(async (req, res) => res.status(201).json({ ok: true, data: await service.registrarIngreso(req.body) }));
const listarIngresos   = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarIngresos() }));
const obtenerIngreso   = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.obtenerIngreso(leerId(req.params.id)) }));

// Traslados
const registrarTraslado = asyncHandler(async (req, res) => res.status(201).json({ ok: true, data: await service.registrarTraslado(req.body) }));
const listarTraslados   = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.listarTraslados() }));
const obtenerTraslado   = asyncHandler(async (req, res) => res.json({ ok: true, data: await service.obtenerTraslado(leerId(req.params.id)) }));

module.exports = {
  listarMateriales, obtenerMaterial, crearMaterial, actualizarMaterial,
  listarBodegas, stockDeBodega, listarKardex,
  registrarIngreso, listarIngresos, obtenerIngreso,
  registrarTraslado, listarTraslados, obtenerTraslado,
};