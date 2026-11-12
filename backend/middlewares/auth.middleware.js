const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const verificarToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401));
  }

  try {
    const token = header.split(' ')[1];
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new AppError('Token inválido o expirado', 401));
  }
};

module.exports = verificarToken;

//Middleware para proteger las rutas, verificacion de inicio de sesion para entrar a las rutas (controllers), con JWT
