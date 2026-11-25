const pool = require('../../config/db');

// Proyecto + cantidad de permisos aprobados (el service calcula puede_iniciar_obra con este dato)
const SELECT_PROYECTO = `
  SELECT p.id, p.codigo, p.nombre, p.tipo_proyecto, p.ubicacion, p.fase_actual, p.estado,
         p.presupuesto_total, p.fecha_inicio_estimada, p.created_at,
         b.id AS bodega_id,
         (SELECT COUNT(*)::int
            FROM permisos_proyecto pp
           WHERE pp.proyecto_id = p.id
             AND pp.entidad IN ('OPAMSS', 'MARN', 'ANDA')
             AND pp.estado = 'APROBADO') AS permisos_aprobados
  FROM proyectos p
  LEFT JOIN bodegas b ON b.proyecto_id = p.id`;

// Ejecuta fn dentro de una transacción (BEGIN/COMMIT, y ROLLBACK si algo falla)
const enTransaccion = async (fn) => {
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

const listar = async ({ estado, fase, tipo, busqueda } = {}) => {
  const condiciones = [];
  const valores = [];
  if (estado) { valores.push(estado); condiciones.push(`p.estado = $${valores.length}`); }
  if (fase)   { valores.push(fase);   condiciones.push(`p.fase_actual = $${valores.length}`); }
  if (tipo)   { valores.push(tipo);   condiciones.push(`p.tipo_proyecto = $${valores.length}`); }
  if (busqueda) {
    valores.push(`%${String(busqueda).trim()}%`);
    const n = valores.length;
    condiciones.push(`(p.nombre ILIKE $${n} OR p.codigo ILIKE $${n} OR p.ubicacion ILIKE $${n})`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(`${SELECT_PROYECTO} ${where} ORDER BY p.id`, valores);
  return rows;
};

const obtenerPorId = async (id) => {
  const { rows } = await pool.query(`${SELECT_PROYECTO} WHERE p.id = $1`, [id]);
  return rows[0] || null;
};

// Crea el proyecto, sus 3 permisos en PENDIENTE y su bodega de obra (la necesitan
// los traslados de inventario y los avances de obra). Devuelve el id.
const crear = async (d) =>
  enTransaccion(async (client) => {
    // El id se reserva primero para derivar el código sin carreras entre creaciones simultáneas
    const { rows: seq } = await client.query(`SELECT nextval(pg_get_serial_sequence('proyectos', 'id')) AS id`);
    const id = Number(seq[0].id);
    const codigo = `PRJ-${String(id).padStart(3, '0')}`;

    await client.query(
      `INSERT INTO proyectos (id, codigo, nombre, tipo_proyecto, ubicacion, presupuesto_total, fecha_inicio_estimada)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, codigo, d.nombre, d.tipo_proyecto, d.ubicacion, d.presupuesto_total, d.fecha_inicio_estimada]
    );

    await client.query(
      `INSERT INTO permisos_proyecto (proyecto_id, entidad)
       SELECT $1::int, e FROM unnest(ARRAY['OPAMSS', 'MARN', 'ANDA']) AS e`,
      [id]
    );

    await client.query(
      `INSERT INTO bodegas (nombre, tipo, proyecto_id, ubicacion)
       VALUES ($1, 'PROYECTO', $2, $3)`,
      [`Bodega Obra ${d.nombre}`.slice(0, 100), id, d.ubicacion.slice(0, 150)]
    );

    return id;
  });

const actualizar = async (id, d) => {
  await pool.query(
    `UPDATE proyectos
        SET nombre = $2, tipo_proyecto = $3, ubicacion = $4,
            presupuesto_total = $5, fecha_inicio_estimada = $6
      WHERE id = $1`,
    [id, d.nombre, d.tipo_proyecto, d.ubicacion, d.presupuesto_total, d.fecha_inicio_estimada]
  );
};

// El trigger trg_validar_permisos_obra rechaza (P0001) el cambio si faltan permisos aprobados
const cambiarFaseYEstado = async (id, fase, estado) => {
  await pool.query('UPDATE proyectos SET fase_actual = $2, estado = $3 WHERE id = $1', [id, fase, estado]);
};

const permisosDeProyecto = async (proyectoId) => {
  const { rows } = await pool.query(
    `SELECT id, proyecto_id, entidad, numero_resolucion, estado,
            fecha_solicitud, fecha_aprobacion, observaciones
     FROM permisos_proyecto
     WHERE proyecto_id = $1
     ORDER BY CASE entidad WHEN 'OPAMSS' THEN 1 WHEN 'MARN' THEN 2 ELSE 3 END`,
    [proyectoId]
  );
  return rows;
};

// Aplica todos los cambios o ninguno. Se bloquea la fila del proyecto para que un cambio de
// permisos no se cruce con un cambio de fase/estado que se esté validando al mismo tiempo.
const actualizarPermisos = async (proyectoId, cambios) =>
  enTransaccion(async (client) => {
    await client.query('SELECT id FROM proyectos WHERE id = $1 FOR UPDATE', [proyectoId]);
    for (const c of cambios) {
      await client.query(
        `INSERT INTO permisos_proyecto
           (proyecto_id, entidad, numero_resolucion, estado, fecha_aprobacion, observaciones)
         VALUES ($1::int, $2::varchar, $3::varchar, $4::varchar,
                 CASE WHEN $7::boolean THEN COALESCE($5::date, CURRENT_DATE) END,
                 $6::text)
         ON CONFLICT (proyecto_id, entidad) DO UPDATE
            SET numero_resolucion = EXCLUDED.numero_resolucion,
                estado            = EXCLUDED.estado,
                fecha_aprobacion  = EXCLUDED.fecha_aprobacion,
                observaciones     = EXCLUDED.observaciones`,
        [proyectoId, c.entidad, c.numero_resolucion, c.estado, c.fecha_aprobacion, c.observaciones, c.estado === 'APROBADO']
      );
    }
  });

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarFaseYEstado,
  permisosDeProyecto,
  actualizarPermisos,
};
