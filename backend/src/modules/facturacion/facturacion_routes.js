const pool = require('../../config/db');

// Consultas SQL de facturas_abonos y de la cuota que se está pagando.
// Los triggers de la BD asignan el correlativo, marcan la cuota PAGADA y liquidan la venta.

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

// Bloquea la cuota (FOR UPDATE) para que dos cobros simultáneos no la paguen dos veces
const bloquearCuota = async (client, cuotaId) => {
  const { rows } = await client.query(
    `SELECT q.id, q.venta_id, q.numero_cuota, q.tipo_cuota, q.monto_capital, q.monto_interes,
            q.monto_total_cuota, q.estado,
            v.numero_contrato, v.estado AS estado_venta, v.plazo_meses, v.cliente_id,
            c.nrc, u.codigo_unidad
     FROM plan_pagos_cuotas q
     JOIN ventas_inmobiliarias v ON v.id = q.venta_id
     JOIN clientes_crm c ON c.id = v.cliente_id
     JOIN unidades_inmobiliarias u ON u.id = v.unidad_id
     WHERE q.id = $1
     FOR UPDATE OF q`,
    [cuotaId]
  );
  return rows[0] || null;
};

// Cuotas anteriores sin pagar (se cobra en orden: prima, cuota 1, cuota 2...)
const cuotaAnteriorPendiente = async (client, ventaId, numeroCuota) => {
  const { rows } = await client.query(
    `SELECT numero_cuota FROM plan_pagos_cuotas
     WHERE venta_id = $1 AND numero_cuota < $2 AND estado <> 'PAGADA'
     ORDER BY numero_cuota LIMIT 1`,
    [ventaId, numeroCuota]
  );
  return rows[0] || null;
};

const insertarFactura = async (client, f) => {
  // numero_correlativo en NULL: el trigger fn_preparar_factura_abono lo genera
  const { rows } = await client.query(
    `INSERT INTO facturas_abonos
       (cuota_id, venta_id, cliente_id, tipo_documento, numero_correlativo, concepto,
        subtotal_gravado, subtotal_exento, iva_13, total_pagado, metodo_pago)
     VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [f.cuota_id, f.venta_id, f.cliente_id, f.tipo_documento, f.concepto,
      f.subtotal_gravado, f.subtotal_exento, f.iva_13, f.total_pagado, f.metodo_pago]
  );
  return rows[0].id;
};

// ---- Consultas ---------------------------------------------------------------------

const SELECT_FACTURA = `
  SELECT f.id, f.numero_correlativo, f.tipo_documento, f.fecha_emision, f.concepto,
         f.subtotal_gravado, f.subtotal_exento, f.iva_13, f.total_pagado, f.metodo_pago,
         f.cuota_id, q.numero_cuota, q.tipo_cuota,
         f.venta_id, v.numero_contrato, u.codigo_unidad,
         f.cliente_id, c.nombres || ' ' || c.apellidos AS cliente,
         c.dui AS cliente_dui, c.nit AS cliente_nit, c.nrc AS cliente_nrc,
         c.giro_economico AS cliente_giro
  FROM facturas_abonos f
  JOIN plan_pagos_cuotas q ON q.id = f.cuota_id
  JOIN ventas_inmobiliarias v ON v.id = f.venta_id
  JOIN unidades_inmobiliarias u ON u.id = v.unidad_id
  JOIN clientes_crm c ON c.id = f.cliente_id`;

const listar = async ({ tipo, clienteId, ventaId, desde, hasta } = {}) => {
  const condiciones = [];
  const valores = [];
  if (tipo) {
    valores.push(tipo);
    condiciones.push(`f.tipo_documento = $${valores.length}`);
  }
  if (clienteId) {
    valores.push(clienteId);
    condiciones.push(`f.cliente_id = $${valores.length}`);
  }
  if (ventaId) {
    valores.push(ventaId);
    condiciones.push(`f.venta_id = $${valores.length}`);
  }
  if (desde) {
    valores.push(desde);
    condiciones.push(`f.fecha_emision >= $${valores.length}::date`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`f.fecha_emision < ($${valores.length}::date + 1)`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(`${SELECT_FACTURA} ${where} ORDER BY f.fecha_emision DESC, f.id DESC`, valores);
  return rows;
};

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(`${SELECT_FACTURA} WHERE f.id = $1`, [id]);
  return rows[0] || null;
};

module.exports = { conTransaccion, bloquearCuota, cuotaAnteriorPendiente, insertarFactura, listar, obtenerPorId };
