const pool = require('../../config/db');

// Consultas SQL de planillas, detalle (boletas) y parámetros legales

const FECHAS = `periodo_inicio::text AS periodo_inicio, periodo_fin::text AS periodo_fin, fecha_pago::text AS fecha_pago`;

// Ejecuta fn dentro de una transacción (si algo falla se deshace todo)
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

// ---- Parámetros legales ------------------------------------------------------

const obtenerParametros = async () => {
  const { rows } = await pool.query('SELECT clave, valor FROM parametros_planilla');
  return Object.fromEntries(rows.map((fila) => [fila.clave, Number(fila.valor)]));
};

const obtenerTramosRenta = async (periodo) => {
  const { rows } = await pool.query(
    'SELECT tramo, desde, hasta, porcentaje, exceso_sobre, cuota_fija FROM tramos_renta WHERE periodo = $1 ORDER BY tramo',
    [periodo]
  );
  return rows;
};

// ---- Empleados que entran a una planilla -------------------------------------

const empleadosActivosPorTipo = async (tipoEmpleado) => {
  const { rows } = await pool.query(
    `SELECT id, codigo_empleado, nombres, apellidos, tipo_empleado, modalidad_pago_campo,
            salario_mensual, tarifa_campo, activo
     FROM empleados WHERE tipo_empleado = $1 AND activo = TRUE ORDER BY apellidos, nombres`,
    [tipoEmpleado]
  );
  return rows;
};

const empleadosPorIds = async (ids) => {
  const { rows } = await pool.query(
    `SELECT id, codigo_empleado, nombres, apellidos, tipo_empleado, modalidad_pago_campo,
            salario_mensual, tarifa_campo, activo
     FROM empleados WHERE id = ANY($1::int[]) ORDER BY apellidos, nombres`,
    [ids]
  );
  return rows;
};

// ---- Consultas ----------------------------------------------------------------

const existeTraslape = async (tipoPlanilla, inicio, fin) => {
  const { rows } = await pool.query(
    `SELECT codigo_planilla FROM planillas
     WHERE tipo_planilla = $1 AND periodo_inicio <= $3::date AND periodo_fin >= $2::date
     LIMIT 1`,
    [tipoPlanilla, inicio, fin]
  );
  return rows[0] || null;
};

const listar = async ({ tipo, estado } = {}) => {
  const condiciones = [];
  const valores = [];
  if (tipo) {
    valores.push(tipo);
    condiciones.push(`p.tipo_planilla = $${valores.length}`);
  }
  if (estado) {
    valores.push(estado);
    condiciones.push(`p.estado = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT p.id, p.codigo_planilla, p.tipo_planilla, ${FECHAS}, p.estado,
            p.total_devengado, p.total_deducciones, p.total_neto,
            (SELECT COUNT(*)::int FROM detalle_planilla d WHERE d.planilla_id = p.id) AS cantidad_empleados
     FROM planillas p ${where}
     ORDER BY p.periodo_inicio DESC, p.id DESC`,
    valores
  );
  return rows;
};

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, codigo_planilla, tipo_planilla, ${FECHAS}, estado,
            total_devengado, total_deducciones, total_neto
     FROM planillas WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const detallesDePlanilla = async (planillaId) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.numero_boleta, d.empleado_id, e.codigo_empleado,
            e.nombres || ' ' || e.apellidos AS empleado, e.cargo,
            d.dias_trabajados, d.unidades_destajo, d.salario_devengado,
            d.descuento_isss, d.descuento_afp, d.descuento_isr, d.salario_neto
     FROM detalle_planilla d
     JOIN empleados e ON e.id = d.empleado_id
     WHERE d.planilla_id = $1
     ORDER BY d.id`,
    [planillaId]
  );
  return rows;
};

// Boleta de pago = una fila de detalle_planilla con los datos de planilla y empleado
const BOLETA_SELECT = `
  SELECT d.id, d.numero_boleta, d.planilla_id, p.codigo_planilla, p.tipo_planilla,
         p.periodo_inicio::text AS periodo_inicio, p.periodo_fin::text AS periodo_fin,
         p.fecha_pago::text AS fecha_pago, p.estado AS estado_planilla,
         e.id AS empleado_id, e.codigo_empleado, e.nombres, e.apellidos, e.dui, e.cargo,
         e.tipo_empleado, e.modalidad_pago_campo, e.salario_mensual, e.tarifa_campo,
         d.dias_trabajados, d.unidades_destajo, d.salario_devengado,
         d.descuento_isss, d.descuento_afp, d.descuento_isr, d.salario_neto
  FROM detalle_planilla d
  JOIN planillas p ON p.id = d.planilla_id
  JOIN empleados e ON e.id = d.empleado_id`;

const obtenerBoleta = async (id) => {
  const { rows } = await pool.query(`${BOLETA_SELECT} WHERE d.id = $1`, [id]);
  return rows[0] || null;
};

const boletasDeEmpleado = async (empleadoId) => {
  const { rows } = await pool.query(
    `${BOLETA_SELECT} WHERE d.empleado_id = $1 ORDER BY p.periodo_inicio DESC, d.id DESC`,
    [empleadoId]
  );
  return rows;
};

// ---- Escritura -------------------------------------------------------------------

// Crea la planilla con todas sus boletas en una sola transacción.
// Los códigos (PLA-ADM-2026-01, BOL-ADM-0001) se generan aquí; el bloqueo
// evita que dos planillas creadas a la vez tomen el mismo número.
const crearCompleta = async (cabecera, detalles, totales, prefijo) => {
  return conTransaccion(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(4101)');

    const anio = cabecera.periodo_inicio.slice(0, 4);
    const prefijoPlanilla = `PLA-${prefijo}-${anio}-`;
    const { rows: siguiente } = await client.query(
      `SELECT COALESCE(MAX(SUBSTRING(codigo_planilla FROM '[0-9]+$')::int), 0) + 1 AS n
       FROM planillas WHERE codigo_planilla LIKE $1`,
      [`${prefijoPlanilla}%`]
    );
    const codigoPlanilla = `${prefijoPlanilla}${String(siguiente[0].n).padStart(2, '0')}`;

    const { rows: planilla } = await client.query(
      `INSERT INTO planillas
         (codigo_planilla, tipo_planilla, periodo_inicio, periodo_fin, fecha_pago, estado,
          total_devengado, total_deducciones, total_neto)
       VALUES ($1, $2, $3, $4, $5, 'BORRADOR', $6, $7, $8)
       RETURNING id`,
      [codigoPlanilla, cabecera.tipo_planilla, cabecera.periodo_inicio, cabecera.periodo_fin,
        cabecera.fecha_pago, totales.total_devengado, totales.total_deducciones, totales.total_neto]
    );
    const planillaId = planilla[0].id;

    const prefijoBoleta = `BOL-${prefijo}-`;
    const { rows: ultima } = await client.query(
      `SELECT COALESCE(MAX(SUBSTRING(numero_boleta FROM '[0-9]+$')::int), 0) AS n
       FROM detalle_planilla WHERE numero_boleta LIKE $1`,
      [`${prefijoBoleta}%`]
    );
    let consecutivo = ultima[0].n;

    for (const d of detalles) {
      consecutivo += 1;
      await client.query(
        `INSERT INTO detalle_planilla
           (planilla_id, empleado_id, numero_boleta, dias_trabajados, unidades_destajo,
            salario_devengado, descuento_isss, descuento_afp, descuento_isr, salario_neto)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [planillaId, d.empleado_id, `${prefijoBoleta}${String(consecutivo).padStart(4, '0')}`,
          d.dias_trabajados, d.unidades_destajo, d.salario_devengado, d.descuento_isss,
          d.descuento_afp, d.descuento_isr, d.salario_neto]
      );
    }
    return planillaId;
  });
};

const actualizarEstado = async (id, estado) => {
  await pool.query('UPDATE planillas SET estado = $1 WHERE id = $2', [estado, id]);
};

const eliminar = async (id) => {
  await pool.query('DELETE FROM planillas WHERE id = $1', [id]); // detalle_planilla se borra en cascada
};

module.exports = {
  obtenerParametros, obtenerTramosRenta, empleadosActivosPorTipo, empleadosPorIds,
  existeTraslape, listar, obtenerPorId, detallesDePlanilla, obtenerBoleta, boletasDeEmpleado,
  crearCompleta, actualizarEstado, eliminar,
};
