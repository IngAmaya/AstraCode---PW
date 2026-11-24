const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');
const model = require('./auth_model');

const login = async ({ login, password }) => {
  if (!login || !password) throw new AppError('Usuario y contraseña son obligatorios', 400);

  const usuario = await model.buscarPorLogin(login);
  const valida = usuario && (await bcrypt.compare(password, usuario.password_hash));
  // Mismo mensaje para usuario inexistente y contraseña incorrecta
  if (!valida) throw new AppError('Credenciales incorrectas', 401);
  if (!usuario.activo) throw new AppError('Usuario desactivado', 403);

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: { id: usuario.id, nombre: usuario.nombre_completo, username: usuario.username, rol: usuario.rol },
  };
};

const registrar = async (d) => {
  const { nombre_completo, username, correo, password, rol, empleado_id } = d;
  if (!nombre_completo || !username || !correo || !password || !rol) {
    throw new AppError('Faltan datos obligatorios', 400);
  }
  if (password.length < 8) throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
  if (username.includes('@')) throw new AppError('El username no puede contener @', 400);

  const rolBD = await model.buscarRolPorNombre(rol);
  if (!rolBD) throw new AppError('El rol no existe', 400);

  const password_hash = await bcrypt.hash(password, 10);
  try {
    const id = await model.crearUsuario({
      empleado_id, nombre_completo, username, correo, password_hash, rol_id: rolBD.id,
    });
    return { id, username, rol: rolBD.nombre };
  } catch (err) {
    if (err.code === '23505') throw new AppError('El username o el correo ya existen', 409);
    // Trigger de la BD: INGENIERO_RESIDENTE y VENTAS requieren empleado_id
    if (err.code === 'P0001') throw new AppError(err.message, 400);
    if (err.code === '23514') throw new AppError('El correo o el username no tienen un formato válido', 400);
    throw err;
  }
};

module.exports = { login, registrar };