const AppError = require('../../utils/AppError');
const model = require('./ventas_model');

const ESTADOS_UNIDAD = ['DISPONIBLE', 'RESERVADA', 'VENDIDA'];
const ESTADOS_VENTA = ['ACTIVA', 'LIQUIDADA', 'ANULADA'];
const TIPOS_UNIDAD = ['CASA', 'APARTAMENTO'];
const TASA_POR_DEFECTO = 7.5;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const redondear = (numero) => Math.round((numero + Number.EPSILON) * 100) / 100;
const aNumero = (valor, porDefecto) =>
  valor === undefined || valor === null || valor === '' ? porDefecto : Number(valor);
const fechaValida = (valor) => {
  if (typeof valor !== 'string' || !FECHA_REGEX.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  // Una fecha imposible (2026-13-45) da Invalid Date: toISOString() lanzaría excepción y respondería 500
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};
const entero = (valor, nombre) => {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) throw new AppError(`${nombre} es obligatorio y debe ser un entero positivo`, 400);
  return numero;
};

// Id opcional de un filtro de la URL: si viene, debe ser un entero positivo (si no, 400 y no 500)
const filtroId = (valor, nombre) => (valor === undefined || valor === '' ? undefined : entero(valor, nombre));

// ---- Unidades ------------------------------------------------------------------------

const listarUnidades = async (query = {}) => {
  if (query.estado && !ESTADOS_UNIDAD.includes(query.estado)) {
    throw new AppError(`estado debe ser: ${ESTADOS_UNIDAD.join(', ')}`, 400);
  }
  if (query.tipo && !TIPOS_UNIDAD.includes(query.tipo)) {
    throw new AppError(`tipo debe ser: ${TIPOS_UNIDAD.join(', ')}`, 400);
  }
  return model.listarUnidades({
    estado: query.estado,
    tipo: query.tipo,
    proyectoId: filtroId(query.proyecto_id, 'proyecto_id'),
  });
};

// ---- Plan de pagos ---------------------------------------------------------------------

// Resumen del estado de cuenta de una venta a partir de sus cuotas
const resumirPlan = (cuotas) => {
  const pendientes = cuotas.filter((c) => c.estado !== 'PAGADA');
  const sumar = (lista) => redondear(lista.reduce((total, c) => total + Number(c.monto_total_cuota), 0));
  return {
    total_cuotas: cuotas.length,
    cuotas_pagadas: cuotas.length - pendientes.length,
    cuotas_vencidas: cuotas.filter((c) => c.estado === 'VENCIDA').length,
    total_pagado: sumar(cuotas.filter((c) => c.estado === 'PAGADA')),
    saldo_pendiente: sumar(pendientes),
    proxima_cuota: pendientes[0] || null,
  };
};

const planDeVenta = async (ventaId) => {
  const venta = await model.obtenerVenta(ventaId);
  if (!venta) throw new AppError('Venta no encontrada', 404);
  const cuotas = await model.cuotasDeVenta(ventaId);
  return { venta, resumen: resumirPlan(cuotas), cuotas };
};

// Todas las ventas de un cliente con su plan (lo que consume la pantalla de plan de pagos)
const planesDeCliente = async (clienteId) => {
  const cliente = await model.obtenerClienteBasico(clienteId);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  const ventas = await model.listarVentas({ clienteId });
  const contratos = await Promise.all(
    ventas.map(async (venta) => {
      const cuotas = await model.cuotasDeVenta(venta.id);
      return { venta, resumen: resumirPlan(cuotas), cuotas };
    })
  );
  return { cliente: { id: cliente.id, nombre: `${cliente.nombres} ${cliente.apellidos}` }, contratos };
};

// ---- Ventas -----------------------------------------------------------------------------

const listarVentas = async (query = {}) => {
  if (query.estado && !ESTADOS_VENTA.includes(query.estado)) {
    throw new AppError(`estado debe ser: ${ESTADOS_VENTA.join(', ')}`, 400);
  }
  return model.listarVentas({
    estado: query.estado,
    clienteId: filtroId(query.cliente_id, 'cliente_id'),
    asesorId: filtroId(query.asesor_id, 'asesor_id'),
  });
};

const obtenerVenta = (id) => planDeVenta(id);

// Errores de la BD que son reglas de negocio (no fallos del servidor). Ocurren, por ejemplo, cuando
// dos asesores venden la misma unidad al mismo tiempo: el segundo pasa la revisión previa pero la BD lo rechaza.
const traducirErrorVenta = (error) => {
  if (error.code === '23505') {
    if (String(error.constraint || '').includes('unidad_id')) return new AppError('La unidad ya fue vendida', 409);
    return new AppError('Ya existe un contrato con ese número', 409);
  }
  if (error.code === 'P0001') return new AppError(error.message, 409); // trigger: unidad ya vendida
  if (error.code === '23503') return new AppError('La unidad, el cliente o el asesor indicado no existe', 404);
  if (error.code === '23514') return new AppError('Los montos de la venta no son válidos (precio = prima + monto a financiar)', 400);
  if (error.code === '22007' || error.code === '22008') return new AppError('fecha_venta no es una fecha válida', 400);
  return error;
};

const crearVenta = async (entrada) => {
  const unidadId = entero(entrada.unidad_id, 'unidad_id');
  const clienteId = entero(entrada.cliente_id, 'cliente_id');
  const asesorId = entero(entrada.asesor_id, 'asesor_id');

  const unidad = await model.obtenerUnidad(unidadId);
  if (!unidad) throw new AppError('La unidad no existe', 404);
  if (unidad.estado === 'VENDIDA') throw new AppError(`La unidad ${unidad.codigo_unidad} ya fue vendida`, 409);
  if (!(await model.obtenerClienteBasico(clienteId))) throw new AppError('El cliente no existe', 404);
  const asesor = await model.obtenerAsesor(asesorId);
  if (!asesor || !asesor.activo) throw new AppError('El asesor no existe, está inactivo o el empleado no es asesor de ventas', 404);

  // Si no se indica otro precio, se vende al precio de lista de la unidad
  const precio = redondear(aNumero(entrada.precio_acordado, Number(unidad.precio_venta)));
  const prima = redondear(aNumero(entrada.monto_prima, NaN));
  const tasa = aNumero(entrada.tasa_interes_anual, TASA_POR_DEFECTO);

  const errores = [];
  if (!(precio > 0)) errores.push('precio_acordado debe ser mayor que 0');
  if (!Number.isFinite(prima) || prima < 0) errores.push('monto_prima es obligatorio y no puede ser negativo');
  else if (prima > precio) errores.push('monto_prima no puede ser mayor que el precio acordado');
  if (!Number.isFinite(tasa) || tasa < 0 || tasa > 100) errores.push('tasa_interes_anual debe estar entre 0 y 100');
  if (entrada.fecha_venta && !fechaValida(entrada.fecha_venta)) errores.push('fecha_venta inválida (use AAAA-MM-DD)');

  const financiar = redondear(precio - prima);
  // Con prima del 100% no hay cuotas, pero la tabla exige plazo > 0
  const plazo = financiar > 0 ? Number(entrada.plazo_meses) : aNumero(entrada.plazo_meses, 1);
  if (!Number.isInteger(plazo) || plazo <= 0 || plazo > 480) {
    errores.push('plazo_meses es obligatorio (entero entre 1 y 480) cuando hay monto a financiar');
  }
  if (errores.length) throw new AppError(errores.join('; '), 400);

  let id;
  try {
    id = await model.crearVenta({
      numero_contrato: entrada.numero_contrato ? String(entrada.numero_contrato).trim() : null,
      unidad_id: unidadId,
      cliente_id: clienteId,
      asesor_id: asesorId,
      fecha_venta: entrada.fecha_venta || null,
      precio_acordado: precio,
      monto_prima: prima,
      monto_financiar: financiar,
      tasa_interes_anual: tasa,
      plazo_meses: plazo,
    });
  } catch (error) {
    throw traducirErrorVenta(error);
  }
  return planDeVenta(id);
};

module.exports = {
  listarUnidades, listarVentas, obtenerVenta, crearVenta, planDeVenta, planesDeCliente,
};
