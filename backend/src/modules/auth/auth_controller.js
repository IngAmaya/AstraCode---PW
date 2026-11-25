const asyncHandler = require('../../utils/asyncHandler');
const service = require('./auth_service');

const login = asyncHandler(async (req, res) => {
  // Acepta el identificador con cualquiera de estos nombres de campo
  const { login: loginField, usuario, username, email, correo, password } = req.body;
  const data = await service.login({
    login: loginField || usuario || username || email || correo,
    password,
  });
  res.json({ ok: true, data });
});

const registrar = asyncHandler(async (req, res) => {
  const data = await service.registrar(req.body);
  res.status(201).json({ ok: true, data });
});

const perfil = (req, res) => {
  res.json({ ok: true, data: req.usuario });
};

module.exports = { login, registrar, perfil };