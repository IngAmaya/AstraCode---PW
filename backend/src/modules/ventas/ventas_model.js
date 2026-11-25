const pool = require('../../config/db');

// Consultas SQL de unidades, ventas (contratos) y plan de pagos.
// El plan de pagos lo genera un trigger de la base al insertar la venta.

const conTransaccion = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ---- Unidades inmobiliarias ----------------------------------------------------

const listarUnidades = async ({ estado, proyectoId, tipo } = {}) => {
  const condiciones = [];
  const valores = [];
  if (estado) {
    valores.push(estado);
    condiciones.push(`u.estado = $${valores.length}`);
  }
  if (proyectoId) {
    valores.push(proyectoId);
    condiciones.push(`u.proyecto_id = $${valores.length}`);
  }
  if (tipo) {
    valores.push(tipo);
    condiciones.push(`u.tipo_unidad = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT u.id, u.proyecto_id, p.nombre AS proyecto, u.codigo_unidad, u.tipo_unidad,
            u.area_m2, u.habitaciones, u.precio_venta, u.estado
     FROM unidades_inmobiliarias u
     JOIN proyectos p ON p.id = u.proyecto_id
     ${where}
     ORDER BY u.proyecto_id, u.codigo_unidad`,
    valores
  );
  return rows;
};

const obtenerUnidad = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, codigo_unidad, precio_venta, estado FROM unidades_inmobiliarias WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const obtenerClienteBasico = async (id) => {
  const { rows } = await pool.query('SELECT id, nombres, apellidos FROM clientes_crm WHERE id = $1', [id]);
  return rows[0] || null;
};

// Un asesor es un empleado administrativo (no de campo ni ingeniero) cuyo cargo es de asesor
// o que tiene usuario con rol VENTAS. Devuelve null si el empleado no existe o no califica.
const obtenerAsesor = async (id) => {
  const { rows } = await pool.query(
    `SELECT e.id, e.activo
       FROM empleados e
      WHERE e.id = $1
        AND e.tipo_empleado = 'ADMINISTRATIVO'
        AND e.es_ingeniero = FALSE
        AND (
          e.cargo ILIKE '%asesor%'
          OR EXISTS (
            SELECT 1 FROM usuarios u JOIN roles r ON r.id = u.rol_id
             WHERE u.empleado_id = e.id AND r.nombre = 'VENTAS'
          )
        )`,
    [id]
  );
  return rows[0] || null;
};

// ---- Ventas ------------------------------------------------------------------------

const SELECT_VENTA = `
  SELECT v.id, v.numero_contrato, v.fecha_venta::text AS fecha_venta, v.estado,
         v.precio_acordado, v.monto_prima, v.monto_financiar, v.tasa_interes_anual, v.plazo_meses,
         v.cliente_id, c.nombres || ' ' || c.apellidos AS cliente,
         v.unidad_id, u.codigo_unidad, u.tipo_unidad,
         v.asesor_id, e.nombres || ' ' || e.apellidos AS asesor
  FROM ventas_inmobiliarias v
  JOIN clientes_crm c ON c.id = v.cliente_id
  JOIN unidades_inmobiliarias u ON u.id = v.unidad_id
  JOIN empleados e ON e.id = v.asesor_id`;

const listarVentas = async ({ estado, clienteId, asesorId } = {}) => {
  const condiciones = [];
  const valores = [];
  if (estado) {
    valores.push(estado);
    condiciones.push(`v.estado = $${valores.length}`);
  }
  if (clienteId) {
    valores.push(clienteId);
    condiciones.push(`v.cliente_id = $${valores.length}`);
  }
  if (asesorId) {
    valores.push(asesorId);
    condiciones.push(`v.asesor_id = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(`${SELECT_VENTA} ${where} ORDER BY v.id DESC`, valores);
  return rows;
};

const obtenerVenta = async (id) => {
  const { rows } = await pool.query(`${SELECT_VENTA} WHERE v.id = $1`, [id]);
  return rows[0] || null;
};

// Una cuota PENDIENTE cuya fecha ya pasó se muestra como VENCIDA (la BD no la actualiza sola)
const CUOTAS_SELECT = `
  SELECT id, venta_id, numero_cuota, tipo_cuota, fecha_vencimiento::text AS fecha_vencimiento,
         monto_capital, monto_interes, monto_total_cuota,
         CASE WHEN estado = 'PENDIENTE' AND fecha_vencimiento < CURRENT_DATE
              THEN 'VENCIDA' ELSE estado END AS estado
  FROM plan_pagos_cuotas`;

const cuotasDeVenta = async (ventaId) => {
  const { rows } = await pool.query(`${CUOTAS_SELECT} WHERE venta_id = $1 ORDER BY numero_cuota`, [ventaId]);
  return rows;
};

// Crea la venta; el trigger marca la unidad, cierra al cliente y genera el plan de pagos
const crearVenta = async (d) => {
  return conTransaccion(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(4102)');

    let numeroContrato = d.numero_contrato;
    if (!numeroContrato) {
      const anio = d.fecha_venta ? d.fecha_venta.slice(0, 4) : String(new Date().getFullYear());
      const prefijo = `CONT-${anio}-`;
      const { rows } = await client.query(
        `SELECT COALESCE(MAX(SUBSTRING(numero_contrato FROM '[0-9]+$')::int), 0) + 1 AS n
         FROM ventas_inmobiliarias WHERE numero_contrato LIKE $1`,
        [`${prefijo}%`]
      );
      numeroContrato = `${prefijo}${String(rows[0].n).padStart(3, '0')}`;
    }

    const { rows } = await client.query(
      `INSERT INTO ventas_inmobiliarias
         (numero_contrato, unidad_id, cliente_id, asesor_id, fecha_venta, precio_acordado,
          monto_prima, monto_financiar, tasa_interes_anual, plazo_meses)
       VALUES ($1,$2,$3,$4,COALESCE($5::date, CURRENT_DATE),$6,$7,$8,$9,$10)
       RETURNING id`,
      [numeroContrato, d.unidad_id, d.cliente_id, d.asesor_id, d.fecha_venta, d.precio_acordado,
        d.monto_prima, d.monto_financiar, d.tasa_interes_anual, d.plazo_meses]
    );
    return rows[0].id;
  });
};

module.exports = {
  listarUnidades, obtenerUnidad, obtenerClienteBasico, obtenerAsesor,
  listarVentas, obtenerVenta, cuotasDeVenta, crearVenta,
};
