const pool = require('../../config/db');

// Consultas SQL de la tabla empleados (sin lógica de negocio)
const COLUMNAS = `id, codigo_empleado, nombres, apellidos, dui, cargo, tipo_empleado,
  modalidad_pago_campo, es_ingeniero, salario_mensual, tarifa_campo,
  proyecto_asignado_id, activo`;

const listar = async ({ tipo, activo, busqueda } = {}) => {
  const condiciones = [];
  const valores = [];

  if (tipo) {
    valores.push(tipo);
    condiciones.push(`tipo_empleado = $${valores.length}`);
  }
  if (activo !== undefined) {
    valores.push(activo);
    condiciones.push(`activo = $${valores.length}`);
  }
  if (busqueda) {
    valores.push(`%${busqueda}%`);
    const n = valores.length;
    condiciones.push(
      `(nombres ILIKE $${n} OR apellidos ILIKE $${n} OR codigo_empleado ILIKE $${n} OR dui ILIKE $${n})`
    );
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM empleados ${where} ORDER BY apellidos, nombres`,
    valores
  );
  return rows;
};

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM empleados WHERE id = $1`, [id]);
  return rows[0] || null;
};

// Siguiente código correlativo: EMP-001, EMP-002, ...
const siguienteCodigo = async () => {
  const { rows } = await pool.query(
    `SELECT 'EMP-' || LPAD((COALESCE(MAX(SUBSTRING(codigo_empleado FROM '[0-9]+$')::int), 0) + 1)::text, 3, '0') AS codigo
     FROM empleados
     WHERE codigo_empleado ~ '^EMP-[0-9]+$'`
  );
  return rows[0].codigo;
};

const crear = async (d) => {
  const { rows } = await pool.query(
    `INSERT INTO empleados
       (codigo_empleado, nombres, apellidos, dui, cargo, tipo_empleado, modalidad_pago_campo,
        es_ingeniero, salario_mensual, tarifa_campo, proyecto_asignado_id, activo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING ${COLUMNAS}`,
    [d.codigo_empleado, d.nombres, d.apellidos, d.dui, d.cargo, d.tipo_empleado,
      d.modalidad_pago_campo, d.es_ingeniero, d.salario_mensual, d.tarifa_campo,
      d.proyecto_asignado_id, d.activo]
  );
  return rows[0];
};

const actualizar = async (id, d) => {
  const { rows } = await pool.query(
    `UPDATE empleados SET
       codigo_empleado = $1, nombres = $2, apellidos = $3, dui = $4, cargo = $5,
       tipo_empleado = $6, modalidad_pago_campo = $7, es_ingeniero = $8,
       salario_mensual = $9, tarifa_campo = $10, proyecto_asignado_id = $11, activo = $12
     WHERE id = $13
     RETURNING ${COLUMNAS}`,
    [d.codigo_empleado, d.nombres, d.apellidos, d.dui, d.cargo, d.tipo_empleado,
      d.modalidad_pago_campo, d.es_ingeniero, d.salario_mensual, d.tarifa_campo,
      d.proyecto_asignado_id, d.activo, id]
  );
  return rows[0] || null;
};

// Baja lógica: el empleado puede tener boletas y ventas asociadas, por eso no se borra
const desactivar = async (id) => {
  const { rows } = await pool.query(
    `UPDATE empleados SET activo = FALSE WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { listar, obtenerPorId, siguienteCodigo, crear, actualizar, desactivar };
