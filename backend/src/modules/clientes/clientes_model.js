const pool = require('../../config/db');

// Consultas SQL del CRM de clientes
const COLUMNAS = `c.id, c.nombres, c.apellidos, c.dui, c.nit, c.nrc, c.giro_economico, c.telefono,
  c.correo, c.estado_embudo, c.proyecto_interes_id, c.asesor_id, c.notas_seguimiento, c.fecha_registro`;

const SELECT_CLIENTE = `
  SELECT ${COLUMNAS},
         p.nombre AS proyecto_interes,
         e.nombres || ' ' || e.apellidos AS asesor
  FROM clientes_crm c
  LEFT JOIN proyectos p ON p.id = c.proyecto_interes_id
  LEFT JOIN empleados e ON e.id = c.asesor_id`;

const listar = async ({ estado, asesorId, busqueda } = {}) => {
  const condiciones = [];
  const valores = [];

  if (estado) {
    valores.push(estado);
    condiciones.push(`c.estado_embudo = $${valores.length}`);
  }
  if (asesorId) {
    valores.push(asesorId);
    condiciones.push(`c.asesor_id = $${valores.length}`);
  }
  if (busqueda) {
    valores.push(`%${busqueda}%`);
    const n = valores.length;
    condiciones.push(
      `(c.nombres ILIKE $${n} OR c.apellidos ILIKE $${n} OR c.dui ILIKE $${n} OR c.correo ILIKE $${n} OR c.telefono ILIKE $${n})`
    );
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `${SELECT_CLIENTE} ${where} ORDER BY c.fecha_registro DESC, c.id DESC`,
    valores
  );
  return rows;
};

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(`${SELECT_CLIENTE} WHERE c.id = $1`, [id]);
  return rows[0] || null;
};

const crear = async (d) => {
  const { rows } = await pool.query(
    `INSERT INTO clientes_crm
       (nombres, apellidos, dui, nit, nrc, giro_economico, telefono, correo,
        estado_embudo, proyecto_interes_id, asesor_id, notas_seguimiento)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [d.nombres, d.apellidos, d.dui, d.nit, d.nrc, d.giro_economico, d.telefono, d.correo,
      d.estado_embudo, d.proyecto_interes_id, d.asesor_id, d.notas_seguimiento]
  );
  return rows[0].id;
};

const actualizar = async (id, d) => {
  await pool.query(
    `UPDATE clientes_crm SET
       nombres = $1, apellidos = $2, dui = $3, nit = $4, nrc = $5, giro_economico = $6,
       telefono = $7, correo = $8, estado_embudo = $9, proyecto_interes_id = $10,
       asesor_id = $11, notas_seguimiento = $12
     WHERE id = $13`,
    [d.nombres, d.apellidos, d.dui, d.nit, d.nrc, d.giro_economico, d.telefono, d.correo,
      d.estado_embudo, d.proyecto_interes_id, d.asesor_id, d.notas_seguimiento, id]
  );
};

const cambiarEstado = async (id, estado) => {
  await pool.query('UPDATE clientes_crm SET estado_embudo = $1 WHERE id = $2', [estado, id]);
};

const eliminar = async (id) => {
  await pool.query('DELETE FROM clientes_crm WHERE id = $1', [id]);
};

module.exports = { listar, obtenerPorId, crear, actualizar, cambiarEstado, eliminar };
