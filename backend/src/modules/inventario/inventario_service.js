const AppError = require('../../utils/AppError');
const model = require('./inventario_model');

const TIPOS_MOV = ['ENTRADA_COMPRA', 'TRASLADO_SALIDA', 'TRASLADO_ENTRADA', 'CONSUMO_OBRA'];

const entero = (v, nombre) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`${nombre} debe ser un entero positivo`, 400);
  return n;
};

const positivo = (v, nombre) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new AppError(`${nombre} debe ser mayor que 0`, 400);
  return n;
};

// ---- Materiales -------------------------------------------------------------

const listarMateriales = (query = {}) => model.listarMateriales({ busqueda: query.q });

const obtenerMaterial = async (id) => {
  const m = await model.obtenerMaterial(id);
  if (!m) throw new AppError('Material no encontrado', 404);
  return m;
};

const crearMaterial = async (entrada) => {
  const errores = [];
  if (!entrada.codigo)       errores.push('codigo es obligatorio');
  if (!entrada.nombre)       errores.push('nombre es obligatorio');
  if (!entrada.unidad_medida) errores.push('unidad_medida es obligatorio');
  if (Number(entrada.costo_unitario) < 0) errores.push('costo_unitario no puede ser negativo');
  if (errores.length) throw new AppError(errores.join('; '), 400);

  const d = {
    codigo:        String(entrada.codigo).trim().toUpperCase(),
    nombre:        String(entrada.nombre).trim(),
    unidad_medida: String(entrada.unidad_medida).trim().toUpperCase(),
    costo_unitario: Number(entrada.costo_unitario) || 0,
    stock_minimo:  Number(entrada.stock_minimo)   || 10,
  };
  try {
    const id = await model.crearMaterial(d);
    return model.obtenerMaterial(id);
  } catch (err) {
    if (err.code === '23505') throw new AppError('Ya existe un material con ese código', 409);
    throw err;
  }
};

const actualizarMaterial = async (id, entrada) => {
  const existente = await obtenerMaterial(id);
  const d = {
    codigo:        String(entrada.codigo        ?? existente.codigo).trim().toUpperCase(),
    nombre:        String(entrada.nombre        ?? existente.nombre).trim(),
    unidad_medida: String(entrada.unidad_medida ?? existente.unidad_medida).trim().toUpperCase(),
    costo_unitario: Number(entrada.costo_unitario ?? existente.costo_unitario),
    stock_minimo:  Number(entrada.stock_minimo  ?? existente.stock_minimo),
  };
  try {
    await model.actualizarMaterial(id, d);
    return model.obtenerMaterial(id);
  } catch (err) {
    if (err.code === '23505') throw new AppError('Ya existe un material con ese código', 409);
    throw err;
  }
};

// ---- Bodegas ----------------------------------------------------------------

const listarBodegas = (query = {}) => model.listarBodegas({ tipo: query.tipo });

const stockDeBodega = async (bodegaId) => {
  const bodegas = await model.listarBodegas();
  if (!bodegas.find((b) => b.id === bodegaId)) throw new AppError('Bodega no encontrada', 404);
  return model.stockDeBodega(bodegaId);
};

// ---- Kardex -----------------------------------------------------------------

const listarKardex = (query = {}) => {
  if (query.tipo && !TIPOS_MOV.includes(query.tipo))
    throw new AppError(`tipo debe ser: ${TIPOS_MOV.join(', ')}`, 400);
  return model.kardex({
    bodegaId:   query.bodega_id  ? Number(query.bodega_id)   : undefined,
    materialId: query.material_id ? Number(query.material_id) : undefined,
    tipo:       query.tipo,
    limite:     query.limite,
  });
};

// ---- Ingresos ---------------------------------------------------------------

const registrarIngreso = async (entrada) => {
  const errores = [];
  if (!entrada.bodega_id)   errores.push('bodega_id es obligatorio');
  if (!entrada.proveedor)   errores.push('proveedor es obligatorio');
  if (!entrada.responsable) errores.push('responsable es obligatorio');
  if (!Array.isArray(entrada.detalles) || !entrada.detalles.length)
    errores.push('detalles debe ser un arreglo con al menos un item');
  if (errores.length) throw new AppError(errores.join('; '), 400);

  const detalles = entrada.detalles.map((d, i) => ({
    material_id:   entero(d.material_id,   `detalles[${i}].material_id`),
    cantidad:      positivo(d.cantidad,    `detalles[${i}].cantidad`),
    costo_unitario: positivo(d.costo_unitario, `detalles[${i}].costo_unitario`),
  }));

  const cabecera = {
    bodega_id:        entero(entrada.bodega_id, 'bodega_id'),
    proveedor:        String(entrada.proveedor).trim(),
    numero_documento: entrada.numero_documento ? String(entrada.numero_documento).trim() : null,
    responsable:      String(entrada.responsable).trim(),
    observaciones:    entrada.observaciones ? String(entrada.observaciones).trim() : null,
  };

  try {
    const id = await model.crearIngreso(cabecera, detalles);
    const ingreso  = await model.obtenerIngreso(id);
    const detalleBD = await model.detalleIngreso(id);
    return { ...ingreso, detalles: detalleBD };
  } catch (err) {
    // El trigger lanza excepción si no es bodega CENTRAL
    if (err.code === 'P0001') throw new AppError(err.message, 400);
    throw err;
  }
};

const listarIngresos = () => model.listarIngresos();

const obtenerIngreso = async (id) => {
  const ingreso = await model.obtenerIngreso(id);
  if (!ingreso) throw new AppError('Ingreso no encontrado', 404);
  const detalles = await model.detalleIngreso(id);
  return { ...ingreso, detalles };
};

// ---- Traslados --------------------------------------------------------------

const registrarTraslado = async (entrada) => {
  const errores = [];
  if (!entrada.bodega_origen_id)  errores.push('bodega_origen_id es obligatorio');
  if (!entrada.bodega_destino_id) errores.push('bodega_destino_id es obligatorio');
  if (!entrada.responsable)       errores.push('responsable es obligatorio');
  if (!Array.isArray(entrada.detalles) || !entrada.detalles.length)
    errores.push('detalles debe ser un arreglo con al menos un item');
  if (errores.length) throw new AppError(errores.join('; '), 400);

  const detalles = entrada.detalles.map((d, i) => ({
    material_id: entero(d.material_id, `detalles[${i}].material_id`),
    cantidad:    positivo(d.cantidad,  `detalles[${i}].cantidad`),
  }));

  const cabecera = {
    bodega_origen_id:  entero(entrada.bodega_origen_id,  'bodega_origen_id'),
    bodega_destino_id: entero(entrada.bodega_destino_id, 'bodega_destino_id'),
    responsable:       String(entrada.responsable).trim(),
    observaciones:     entrada.observaciones ? String(entrada.observaciones).trim() : null,
  };

  try {
    const id = await model.crearTraslado(cabecera, detalles);
    const traslado = await model.obtenerTraslado(id);
    const detalleBD = await model.detalleTraslado(id);
    return { ...traslado, detalles: detalleBD };
  } catch (err) {
    if (err.code === 'P0001') throw new AppError(err.message, 409); // stock insuficiente o bodega inválida
    throw err;
  }
};

const listarTraslados = () => model.listarTraslados();

const obtenerTraslado = async (id) => {
  const traslado = await model.obtenerTraslado(id);
  if (!traslado) throw new AppError('Traslado no encontrado', 404);
  const detalles = await model.detalleTraslado(id);
  return { ...traslado, detalles };
};

module.exports = {
  listarMateriales, obtenerMaterial, crearMaterial, actualizarMaterial,
  listarBodegas, stockDeBodega, listarKardex,
  registrarIngreso, listarIngresos, obtenerIngreso,
  registrarTraslado, listarTraslados, obtenerTraslado,
};