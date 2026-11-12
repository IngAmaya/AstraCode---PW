const AppError = require('../utils/AppError');

const permitirRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return next(new AppError('No tienes permisos para esta acción', 403));
  }
  next();
};

module.exports = permitirRoles;

//Relacionado con el JWT, busca la autorizacion dependiendo del rol del usuario