const AppError = require('../../utils/AppError');
const { IVA } = require('../../utils/constants');
const model = require('./facturacion_model');

const TIPOS_DOCUMENTO = ['RECIBO', 'FACTURA_CONSUMIDOR_FINAL', 'CCF'];
const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'FINANCIAMIENTO_BANCARIO'];
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Fecha AAAA-MM-DD que además exista en el calendario (rechaza 2026-13-45)
const fechaValida = (valor) => {
  if (typeof valor !== 'string' || !FECHA_REGEX.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  // Una fecha imposible (2026-13-45) da Invalid Date: toISOString() lanzaría excepción y respondería 500
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

const filtroId = (valor, nombre) => {
  if (valor === undefined || valor === '') return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`${nombre} debe ser un entero positivo`, 400);
  return n;
};

const redondear = (numero) => Math.round((numero + Number.EPSILON) * 100) / 100;

// REGLA DE IVA
const desglosarIva = (cuota) => {
  const capital = Number(cuota.monto_capital);
  const gravado = redondear(capital / (1 + IVA));
  return {
    subtotal_gravado: gravado,
    iva_13: redondear(capital - gravado),
    subtotal_exento: redondear(Number(cuota.monto_interes)),
  };
};

const concepto = (cuota) =>
  cuota.tipo_cuota === 'PRIMA'
    ? `Pago de prima - contrato ${cuota.numero_contrato} - ${cuota.codigo_unidad}`
    : `Pago de cuota ${cuota.numero_cuota} de ${cuota.plazo_meses} - contrato ${cuota.numero_contrato} - ${cuota.codigo_unidad}`;

// Registra el abono de una cuota
const registrarAbono = async (entrada, clienteIdRuta) => {
  const cuotaId = Number(entrada.cuota_id);
  if (!Number.isInteger(cuotaId) || cuotaId <= 0) throw new AppError('cuota_id es obligatorio', 400);
  if (!TIPOS_DOCUMENTO.includes(entrada.tipo_documento)) {
    throw new AppError(`tipo_documento debe ser: ${TIPOS_DOCUMENTO.join(', ')}`, 400);
  }
  if (!METODOS_PAGO.includes(entrada.metodo_pago)) {
    throw new AppError(`metodo_pago debe ser: ${METODOS_PAGO.join(', ')}`, 400);
  }

  const facturaId = await model.conTransaccion(async (tx) => {
    const cuota = await model.bloquearCuota(tx, cuotaId);
    if (!cuota) throw new AppError('La cuota no existe', 404);

    if (clienteIdRuta && cuota.cliente_id !== clienteIdRuta) {
      throw new AppError('La cuota no pertenece a ese cliente', 400);
    }
    if (cuota.estado === 'PAGADA') throw new AppError('La cuota ya fue pagada', 409);
    if (cuota.estado_venta !== 'ACTIVA') throw new AppError(`La venta está ${cuota.estado_venta}`, 409);

    const anterior = await model.cuotaAnteriorPendiente(tx, cuota.venta_id, cuota.numero_cuota);
    if (anterior) {
      const nombre = anterior.numero_cuota === 0 ? 'la prima' : `la cuota ${anterior.numero_cuota}`;
      throw new AppError(`Primero debe pagarse ${nombre}`, 409);
    }

    // La BD no verifica que lo cobrado coincida con la cuota: se valida aquí
    const total = redondear(Number(cuota.monto_total_cuota));
    if (entrada.total_pagado !== undefined && redondear(Number(entrada.total_pagado)) !== total) {
      throw new AppError(`El abono debe ser por el valor exacto de la cuota ($${total.toFixed(2)})`, 400);
    }

    // El CCF solo se emite a contribuyentes (con NRC)
    if (entrada.tipo_documento === 'CCF' && !(cuota.nrc && cuota.nrc.trim())) {
      throw new AppError('No se puede emitir un CCF: el cliente no tiene NRC registrado', 422);
    }

    return model.insertarFactura(tx, {
      cuota_id: cuota.id,
      venta_id: cuota.venta_id,
      cliente_id: cuota.cliente_id,
      tipo_documento: entrada.tipo_documento,
      concepto: entrada.concepto ? String(entrada.concepto).trim().slice(0, 200) : concepto(cuota),
      ...desglosarIva(cuota),
      total_pagado: total,
      metodo_pago: entrada.metodo_pago,
    });
  });

  return model.obtenerPorId(facturaId);
};

const listar = async (query = {}) => {
  if (query.tipo && !TIPOS_DOCUMENTO.includes(query.tipo)) {
    throw new AppError(`tipo debe ser: ${TIPOS_DOCUMENTO.join(', ')}`, 400);
  }
  for (const campo of ['desde', 'hasta']) {
    if (query[campo] !== undefined && !fechaValida(query[campo])) {
      throw new AppError(`${campo} inválida (use AAAA-MM-DD)`, 400);
    }
  }
  return model.listar({
    tipo: query.tipo,
    clienteId: filtroId(query.cliente_id, 'cliente_id'),
    ventaId: filtroId(query.venta_id, 'venta_id'),
    desde: query.desde,
    hasta: query.hasta,
  });
};

const obtener = async (id) => {
  const factura = await model.obtenerPorId(id);
  if (!factura) throw new AppError('Documento no encontrado', 404);
  return factura;
};

module.exports = { registrarAbono, listar, obtener };
