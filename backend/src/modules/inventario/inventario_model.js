const pool = require('../../config/db');

// ---- Materiales --------------------------------------------------------------

const listarMateriales = async ({ busqueda } = {}) => {
  const valores = [];
  let where = '';
  if (busqueda) {
    valores.push(`%${busqueda}%`);
    where = `WHERE m.nombre ILIKE $1 OR m.codigo ILIKE $1`;
  }
  const { rows } = await pool.query(
    `SELECT m.id, m.codigo, m.nombre, m.unidad_medida, m.costo_unitario, m.stock_minimo,
            COALESCE(SUM(ib.stock_actual) FILTER (WHERE b.tipo = 'CENTRAL'), 0) AS stock_central,
            COALESCE(SUM(ib.stock_actual), 0) AS stock_total
     FROM materiales m
     LEFT JOIN inventario_bodega ib ON ib.material_id = m.id
     LEFT JOIN bodegas b ON b.id = ib.bodega_id
     ${where}
     GROUP BY m.id ORDER BY m.nombre`,
    valores
  );
  return rows;
};

const obtenerMaterial = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, codigo, nombre, unidad_medida, costo_unitario, stock_minimo FROM materiales WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const crearMaterial = async (d) => {
  const { rows } = await pool.query(
    `INSERT INTO materiales (codigo, nombre, unidad_medida, costo_unitario, stock_minimo)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [d.codigo, d.nombre, d.unidad_medida, d.costo_unitario, d.stock_minimo ?? 10]
  );
  return rows[0].id;
};

const actualizarMaterial = async (id, d) => {
  await pool.query(
    `UPDATE materiales SET codigo=$1, nombre=$2, unidad_medida=$3, costo_unitario=$4, stock_minimo=$5
     WHERE id=$6`,
    [d.codigo, d.nombre, d.unidad_medida, d.costo_unitario, d.stock_minimo, id]
  );
};

// ---- Bodegas ----------------------------------------------------------------

const listarBodegas = async ({ tipo } = {}) => {
  const valores = [];
  let where = '';
  if (tipo) { valores.push(tipo); where = 'WHERE b.tipo = $1'; }
  const { rows } = await pool.query(
    `SELECT b.id, b.nombre, b.tipo, b.ubicacion, b.proyecto_id, p.nombre AS proyecto
     FROM bodegas b
     LEFT JOIN proyectos p ON p.id = b.proyecto_id
     ${where} ORDER BY b.tipo, b.nombre`,
    valores
  );
  return rows;
};

// Inventario de una bodega específica
const stockDeBodega = async (bodegaId) => {
  const { rows } = await pool.query(
    `SELECT ib.id, ib.material_id, m.codigo, m.nombre, m.unidad_medida,
            ib.stock_actual, m.stock_minimo,
            (ib.stock_actual < m.stock_minimo) AS bajo_minimo,
            ib.ultima_actualizacion
     FROM inventario_bodega ib
     JOIN materiales m ON m.id = ib.material_id
     WHERE ib.bodega_id = $1
     ORDER BY m.nombre`,
    [bodegaId]
  );
  return rows;
};

// ---- Kardex -----------------------------------------------------------------

const kardex = async ({ bodegaId, materialId, tipo, limite } = {}) => {
  const condiciones = [];
  const valores = [];
  if (bodegaId)  { valores.push(bodegaId);  condiciones.push(`k.bodega_id = $${valores.length}`); }
  if (materialId){ valores.push(materialId); condiciones.push(`k.material_id = $${valores.length}`); }
  if (tipo)      { valores.push(tipo);       condiciones.push(`k.tipo_movimiento = $${valores.length}`); }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const lim   = Number.isInteger(Number(limite)) && limite > 0 ? `LIMIT ${Number(limite)}` : 'LIMIT 200';
  const { rows } = await pool.query(
    `SELECT k.id, k.tipo_movimiento, k.cantidad, k.saldo_resultante, k.referencia_id,
            k.fecha, k.bodega_id, b.nombre AS bodega,
            k.material_id, m.nombre AS material, m.unidad_medida
     FROM kardex_movimientos k
     JOIN bodegas b ON b.id = k.bodega_id
     JOIN materiales m ON m.id = k.material_id
     ${where} ORDER BY k.fecha DESC, k.id DESC ${lim}`,
    valores
  );
  return rows;
};

// ---- Ingresos (compras a bodega central) ------------------------------------

const conTransaccion = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const siguienteCodigoIngreso = async (client) => {
  const { rows } = await client.query(
    `SELECT 'ING-' || LPAD((COALESCE(MAX(SUBSTRING(codigo_ingreso FROM '[0-9]+$')::int),0)+1)::text,5,'0') AS codigo
     FROM ingresos_bodega WHERE codigo_ingreso ~ '^ING-[0-9]+$'`
  );
  return rows[0].codigo;
};

const crearIngreso = async (cabecera, detalles) => {
  return conTransaccion(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(5001)');
    const codigo = await siguienteCodigoIngreso(client);

    const { rows } = await client.query(
      `INSERT INTO ingresos_bodega (codigo_ingreso, bodega_id, proveedor, numero_documento, responsable, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [codigo, cabecera.bodega_id, cabecera.proveedor,
       cabecera.numero_documento || null, cabecera.responsable, cabecera.observaciones || null]
    );
    const ingresoId = rows[0].id;

    for (const d of detalles) {
      await client.query(
        `INSERT INTO detalle_ingresos (ingreso_id, material_id, cantidad, costo_unitario)
         VALUES ($1,$2,$3,$4)`,
        [ingresoId, d.material_id, d.cantidad, d.costo_unitario]
      );
    }
    return ingresoId;
  });
};

const listarIngresos = async () => {
  const { rows } = await pool.query(
    `SELECT i.id, i.codigo_ingreso, i.proveedor, i.numero_documento,
            i.responsable, i.observaciones, i.fecha_ingreso,
            b.nombre AS bodega
     FROM ingresos_bodega i
     JOIN bodegas b ON b.id = i.bodega_id
     ORDER BY i.fecha_ingreso DESC, i.id DESC LIMIT 200`
  );
  return rows;
};

const detalleIngreso = async (ingresoId) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.material_id, m.nombre AS material, m.unidad_medida,
            d.cantidad, d.costo_unitario, (d.cantidad * d.costo_unitario) AS subtotal
     FROM detalle_ingresos d
     JOIN materiales m ON m.id = d.material_id
     WHERE d.ingreso_id = $1 ORDER BY d.id`,
    [ingresoId]
  );
  return rows;
};

const obtenerIngreso = async (id) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.codigo_ingreso, i.proveedor, i.numero_documento,
            i.responsable, i.observaciones, i.fecha_ingreso, b.nombre AS bodega
     FROM ingresos_bodega i JOIN bodegas b ON b.id = i.bodega_id WHERE i.id = $1`,
    [id]
  );
  return rows[0] || null;
};

// ---- Traslados (central -> proyecto) ----------------------------------------

const siguienteCodigoTraslado = async (client) => {
  const { rows } = await client.query(
    `SELECT 'TRS-' || LPAD((COALESCE(MAX(SUBSTRING(codigo_traslado FROM '[0-9]+$')::int),0)+1)::text,5,'0') AS codigo
     FROM traslados WHERE codigo_traslado ~ '^TRS-[0-9]+$'`
  );
  return rows[0].codigo;
};

const crearTraslado = async (cabecera, detalles) => {
  return conTransaccion(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(5002)');
    const codigo = await siguienteCodigoTraslado(client);

    const { rows } = await client.query(
      `INSERT INTO traslados (codigo_traslado, bodega_origen_id, bodega_destino_id, responsable, observaciones)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [codigo, cabecera.bodega_origen_id, cabecera.bodega_destino_id,
       cabecera.responsable, cabecera.observaciones || null]
    );
    const trasladoId = rows[0].id;

    for (const d of detalles) {
      // El trigger fn_procesar_detalle_traslado descuenta y suma el stock
      await client.query(
        `INSERT INTO detalle_traslados (traslado_id, material_id, cantidad) VALUES ($1,$2,$3)`,
        [trasladoId, d.material_id, d.cantidad]
      );
    }
    return trasladoId;
  });
};

const listarTraslados = async () => {
  const { rows } = await pool.query(
    `SELECT t.id, t.codigo_traslado, t.responsable, t.observaciones, t.fecha_traslado,
            bo.nombre AS bodega_origen, bd.nombre AS bodega_destino
     FROM traslados t
     JOIN bodegas bo ON bo.id = t.bodega_origen_id
     JOIN bodegas bd ON bd.id = t.bodega_destino_id
     ORDER BY t.fecha_traslado DESC, t.id DESC LIMIT 200`
  );
  return rows;
};

const obtenerTraslado = async (id) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.codigo_traslado, t.responsable, t.observaciones, t.fecha_traslado,
            bo.nombre AS bodega_origen, bd.nombre AS bodega_destino
     FROM traslados t
     JOIN bodegas bo ON bo.id = t.bodega_origen_id
     JOIN bodegas bd ON bd.id = t.bodega_destino_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const detalleTraslado = async (trasladoId) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.material_id, m.nombre AS material, m.unidad_medida, d.cantidad
     FROM detalle_traslados d
     JOIN materiales m ON m.id = d.material_id
     WHERE d.traslado_id = $1 ORDER BY d.id`,
    [trasladoId]
  );
  return rows;
};

module.exports = {
  listarMateriales, obtenerMaterial, crearMaterial, actualizarMaterial,
  listarBodegas, stockDeBodega, kardex,
  crearIngreso, listarIngresos, obtenerIngreso, detalleIngreso,
  crearTraslado, listarTraslados, obtenerTraslado, detalleTraslado,
};