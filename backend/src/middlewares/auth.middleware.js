const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const authModel = require('../modules/auth/auth_model');

// Verifica el JWT y además consulta la BD: así un usuario desactivado o con el rol cambiado
// pierde el acceso de inmediato y no hasta que expire su token.
const verificarToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401));
  }

  let payload;
  try {
    payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch (error) {
    return next(new AppError('Token inválido o expirado', 401));
  }

  try {
    const sesion = await authModel.buscarSesion(payload.id);
    if (!sesion) return next(new AppError('El usuario ya no existe', 401));
    if (!sesion.activo) return next(new AppError('Usuario desactivado', 403));

    // El rol sale de la BD, no del token (por si cambió desde el inicio de sesión)
    req.usuario = { ...payload, rol: sesion.rol, empleado_id: sesion.empleado_id };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verificarToken;
