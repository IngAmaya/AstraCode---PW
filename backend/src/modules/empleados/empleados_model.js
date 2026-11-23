const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const service = require('./empleados_service');

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

const crear = asyncHandler(async (req, res) => {
  const data = await service.crear(req.body);
  res.status(201).json({ ok: true, data });
});

const actualizar = asyncHandler(async (req, res) => {
  const data = await service.actualizar(leerId(req.params.id), req.body);
  res.json({ ok: true, data });
});

const desactivar = asyncHandler(async (req, res) => {
  const data = await service.desactivar(leerId(req.params.id));
  res.json({ ok: true, data, message: 'Empleado dado de baja' });
});

module.exports = { listar, obtener, crear, actualizar, desactivar };
