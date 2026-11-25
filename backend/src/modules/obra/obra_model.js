const pool = require('../../config/db');

// ---- Partidas ---------------------------------------------------------------

const SELECT_PARTIDA = `
  SELECT p.id, p.proyecto_id, pr.nombre AS proyecto, p.fase,
         p.codigo_partida, p.nombre, p.porcentaje_avance, p.costo_materiales_acumulado
  FROM partidas_obra p
  JOIN proyectos pr ON pr.id = p.proyecto_id`;

const listarPartidas = async ({ proyectoId, fase } = {}) => {
  const condiciones = [];
  const valores = [];
  if (proyectoId) { valores.push(proyectoId); condiciones.push(`p.proyecto_id = $${valores.length}`); }
  if (fase)       { valores.push(fase);       condiciones.push(`p.fase = $${valores.length}`); }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(`${SELECT_PARTIDA} ${where} ORDER BY p.proyecto_id, p.fase, p.codigo_partida`, valores);
  return rows;
};

const obtenerPartida = async (id) => {
  const { rows } = await pool.query(`${SELECT_PARTIDA} WHERE p.id = $1`, [id]);
  return rows[0] || null;
};

const crearPartida = async (d) => {
  const { rows } = await pool.query(
    `INSERT INTO partidas_obra (proyecto_id, fase, codigo_partida, nombre)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [d.proyecto_id, d.fase, d.codigo_partida, d.nombre]
  );
  return rows[0].id;
};

// ---- Receta de materiales ---------------------------------------------------

const recetaDePartida = async (partidaId) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.partida_id, r.material_id, m.nombre AS material,
            m.unidad_medida, r.cantidad_total_requerida
     FROM receta_partida_materiales r
     JOIN materiales m ON m.id = r.material_id
     WHERE r.partida_id = $1 ORDER BY m.nombre`,
    [partidaId]
  );
  return rows;
};

const upsertReceta = async (partidaId, materialId, cantidad) => {
  await pool.query(
    `INSERT INTO receta_partida_materiales (partida_id, material_id, cantidad_total_requerida)
     VALUES ($1,$2,$3)
     ON CONFLICT (partida_id, material_id)
     DO UPDATE SET cantidad_total_requerida = EXCLUDED.cantidad_total_requerida`,
    [partidaId, materialId, cantidad]
  );
};

// Solo borra si el item pertenece a esa partida. Devuelve true si se eliminó algo.
const eliminarRecetaItem = async (partidaId, recetaId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM receta_partida_materiales WHERE id = $1 AND partida_id = $2',
    [recetaId, partidaId]
  );
  return rowCount > 0;
};

// ---- Avances ----------------------------------------------------------------

const SELECT_AVANCE = `
  SELECT r.id, r.partida_id, p.codigo_partida, p.nombre AS partida,
         r.ingeniero_id, e.nombres || ' ' || e.apellidos AS ingeniero,
         r.fecha_reporte, r.porcentaje_anterior, r.porcentaje_nuevo,
         r.costo_calculado_avance, r.observaciones
  FROM reportes_avance r
  JOIN partidas_obra p ON p.id = r.partida_id
  JOIN empleados e ON e.id = r.ingeniero_id`;

const listarAvances = async ({ partidaId, ingenieroId } = {}) => {
  const condiciones = [];
  const valores = [];
  if (partidaId)   { valores.push(partidaId);   condiciones.push(`r.partida_id = $${valores.length}`); }
  if (ingenieroId) { valores.push(ingenieroId); condiciones.push(`r.ingeniero_id = $${valores.length}`); }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(`${SELECT_AVANCE} ${where} ORDER BY r.fecha_reporte DESC, r.id DESC LIMIT 200`, valores);
  return rows;
};

const obtenerAvance = async (id) => {
  const { rows } = await pool.query(`${SELECT_AVANCE} WHERE r.id = $1`, [id]);
  return rows[0] || null;
};

// El trigger fn_procesar_avance_obra hace todo: descuenta stock, registra kardex, actualiza la partida
const registrarAvance = async (d) => {
  const { rows } = await pool.query(
    `INSERT INTO reportes_avance
       (partida_id, ingeniero_id, porcentaje_anterior, porcentaje_nuevo, observaciones)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [d.partida_id, d.ingeniero_id, d.porcentaje_anterior, d.porcentaje_nuevo, d.observaciones || null]
  );
  return rows[0].id;
};

// Empleado vinculado a un usuario del sistema (null si el usuario no tiene empleado_id)
const empleadoDeUsuario = async (usuarioId) => {
  const { rows } = await pool.query('SELECT empleado_id FROM usuarios WHERE id = $1', [usuarioId]);
  return rows[0]?.empleado_id ?? null;
};

const obtenerEmpleado = async (empleadoId) => {
  const { rows } = await pool.query(
    'SELECT id, es_ingeniero, activo FROM empleados WHERE id = $1',
    [empleadoId]
  );
  return rows[0] || null;
};

const consumosDeAvance = async (avanceId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.material_id, m.nombre AS material, m.unidad_medida,
            c.cantidad_consumida, c.costo_unitario_aplicado, c.subtotal_costo
     FROM consumos_material_avance c
     JOIN materiales m ON m.id = c.material_id
     WHERE c.reporte_avance_id = $1 ORDER BY m.nombre`,
    [avanceId]
  );
  return rows;
};

module.exports = {
  listarPartidas, obtenerPartida, crearPartida,
  recetaDePartida, upsertReceta, eliminarRecetaItem,
  listarAvances, obtenerAvance, registrarAvance, consumosDeAvance,
  empleadoDeUsuario, obtenerEmpleado,
};