const pool = require('../../config/db');

// Busca por username o correo, sin distinguir mayúsculas
const buscarPorLogin = async (login) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre_completo, u.username, u.correo, u.password_hash, u.activo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.correo) = LOWER($1)`,
    [login]
  );
  return rows[0] || null;
};

// Estado ACTUAL del usuario en la BD (el token solo prueba quién era cuando inició sesión)
const buscarSesion = async (id) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.activo, u.empleado_id, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const buscarRolPorNombre = async (nombre) => {
  const { rows } = await pool.query('SELECT id, nombre FROM roles WHERE nombre = $1', [nombre]);
  return rows[0] || null;
};

const crearUsuario = async (d) => {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (empleado_id, nombre_completo, username, correo, password_hash, rol_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [d.empleado_id || null, d.nombre_completo, d.username, d.correo, d.password_hash, d.rol_id]
  );
  return rows[0].id;
};

module.exports = { buscarPorLogin, buscarSesion, buscarRolPorNombre, crearUsuario };