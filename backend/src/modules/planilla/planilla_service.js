const AppError = require('../../utils/AppError');
const { ISSS, AFP } = require('../../utils/constants');
const model = require('./planilla_model');

// Reglas de cada tipo de planilla
const TIPOS = {
  ADMINISTRATIVA_QUINCENAL: { prefijo: 'ADM', tipoEmpleado: 'ADMINISTRATIVO', periodoRenta: 'QUINCENAL', maxDias: 16 },
  CAMPO_SEMANAL: { prefijo: 'CAM', tipoEmpleado: 'CAMPO', periodoRenta: null, maxDias: 7 },
};
const DIAS_QUINCENA = 15;
const MAX_DIAS_SEMANA = 7;
const SIGUIENTE_ESTADO = { BORRADOR: 'APROBADA', APROBADA: 'PAGADA' };
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Redondeo a 2 decimales (la tabla exige neto = devengado - deducciones exacto)
const redondear = (numero) => Math.round((numero + Number.EPSILON) * 100) / 100;

const fechaValida = (valor) =>
  typeof valor === 'string' &&
  FECHA_REGEX.test(valor) &&
  new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;

const diasEntre = (inicio, fin) =>
  (Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86400000 + 1;

// ---- Validación de la cabecera ---------------------------------------------------

const validarCabecera = (entrada) => {
  const errores = [];
  const config = TIPOS[entrada.tipo_planilla];
  if (!config) errores.push(`tipo_planilla debe ser: ${Object.keys(TIPOS).join(', ')}`);

  if (!fechaValida(entrada.periodo_inicio)) errores.push('periodo_inicio inválido (use AAAA-MM-DD)');
  if (!fechaValida(entrada.periodo_fin)) errores.push('periodo_fin inválido (use AAAA-MM-DD)');
  const fechaPago = entrada.fecha_pago || entrada.periodo_fin;
  if (!fechaValida(fechaPago)) errores.push('fecha_pago inválida (use AAAA-MM-DD)');

  if (!errores.length) {
    const dias = diasEntre(entrada.periodo_inicio, entrada.periodo_fin);
    if (dias < 1) errores.push('periodo_fin no puede ser anterior a periodo_inicio');
    else if (dias > config.maxDias) errores.push(`El período de esta planilla no puede exceder ${config.maxDias} días`);
  }

  if (errores.length) throw new AppError(errores.join('; '), 400);
  return {
    tipo_planilla: entrada.tipo_planilla,
    periodo_inicio: entrada.periodo_inicio,
    periodo_fin: entrada.periodo_fin,
    fecha_pago: fechaPago,
  };
};

// ---- Cálculos --------------------------------------------------------------------

// ISR = cuota_fija + (base - exceso_sobre) * porcentaje / 100, según el tramo de la tabla
const calcularRenta = (base, tramos) => {
  if (base <= 0) return 0;
  const tramo = tramos.find(
    (t) => base >= Number(t.desde) && (t.hasta === null || base <= Number(t.hasta))
  );
  if (!tramo) return 0;
  const exceso = base - Number(tramo.exceso_sobre);
  return redondear(Number(tramo.cuota_fija) + (exceso * Number(tramo.porcentaje)) / 100);
};

// Administrativa: salario mensual / 2, menos ISSS, AFP e ISR
const calcularAdministrativo = (empleado, dias, parametros, tramos) => {
  const devengado = redondear((Number(empleado.salario_mensual) / 2) * (dias / DIAS_QUINCENA));
  const isss = redondear((devengado * parametros.isssPct) / 100);
  const afp = redondear((devengado * parametros.afpPct) / 100);
  const isr = calcularRenta(redondear(devengado - isss - afp), tramos);

  return {
    dias_trabajados: dias,
    unidades_destajo: 0,
    salario_devengado: devengado,
    descuento_isss: isss,
    descuento_afp: afp,
    descuento_isr: isr,
    salario_neto: redondear(devengado - isss - afp - isr),
  };
};

// Campo: por día (días x tarifa) o a destajo (unidades x tarifa). Sin deducciones.
const calcularCampo = (empleado, entrada) => {
  const tarifa = Number(empleado.tarifa_campo);
  const dias = Number(entrada.dias_trabajados || 0);
  const unidades = Number(entrada.unidades_destajo || 0);
  const nombre = `${empleado.codigo_empleado} (${empleado.nombres} ${empleado.apellidos})`;

  if (!(dias >= 0 && dias <= MAX_DIAS_SEMANA)) {
    throw new AppError(`dias_trabajados de ${nombre} debe estar entre 0 y ${MAX_DIAS_SEMANA}`, 400);
  }

  let devengado;
  if (empleado.modalidad_pago_campo === 'POR_DIA') {
    if (!(dias > 0)) throw new AppError(`${nombre} se paga por día: indique dias_trabajados`, 400);
    devengado = redondear(dias * tarifa);
  } else {
    if (!(unidades > 0)) throw new AppError(`${nombre} es destajista: indique unidades_destajo`, 400);
    devengado = redondear(unidades * tarifa);
  }

  return {
    dias_trabajados: dias,
    unidades_destajo: unidades,
    salario_devengado: devengado,
    descuento_isss: 0,
    descuento_afp: 0,
    descuento_isr: 0,
    salario_neto: devengado,
  };
};

// Porcentajes vigentes desde la BD (parametros_planilla); si faltan, usa las constantes
const obtenerPorcentajes = async () => {
  const parametros = await model.obtenerParametros();
  return {
    isssPct: parametros.ISSS_EMPLEADO_PCT ?? ISSS * 100,
    afpPct: parametros.AFP_EMPLEADO_PCT ?? AFP * 100,
  };
};

// Calcula la planilla completa SIN guardarla (sirve de vista previa)
const calcular = async (entrada) => {
  const cabecera = validarCabecera(entrada);
  const config = TIPOS[cabecera.tipo_planilla];
  const lineas = Array.isArray(entrada.detalles) ? entrada.detalles : [];

  const ids = lineas.map((linea) => Number(linea.empleado_id));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new AppError('Cada detalle debe incluir un empleado_id válido', 400);
  }
  if (new Set(ids).size !== ids.length) throw new AppError('Hay empleados repetidos en los detalles', 400);

  let empleados;
  if (lineas.length) {
    empleados = await model.empleadosPorIds(ids);
    if (empleados.length !== ids.length) throw new AppError('Algún empleado de los detalles no existe', 404);
  } else if (config.tipoEmpleado === 'ADMINISTRATIVO') {
    empleados = await model.empleadosActivosPorTipo('ADMINISTRATIVO'); // por defecto, todos los activos
  } else {
    throw new AppError('La planilla de campo requiere detalles con días o unidades por empleado', 400);
  }
  if (!empleados.length) throw new AppError('No hay empleados para incluir en la planilla', 400);

  for (const e of empleados) {
    if (e.tipo_empleado !== config.tipoEmpleado || !e.activo) {
      throw new AppError(`${e.codigo_empleado} no es personal ${config.tipoEmpleado} activo`, 400);
    }
  }

  let calculoAdmin = null;
  if (config.tipoEmpleado === 'ADMINISTRATIVO') {
    const [porcentajes, tramos] = await Promise.all([
      obtenerPorcentajes(),
      model.obtenerTramosRenta(config.periodoRenta),
    ]);
    calculoAdmin = { porcentajes, tramos };
  }

  const detalles = empleados.map((empleado) => {
    const linea = lineas.find((l) => Number(l.empleado_id) === empleado.id) || {};
    let monto;
    if (calculoAdmin) {
      const dias = linea.dias_trabajados === undefined ? DIAS_QUINCENA : Number(linea.dias_trabajados);
      if (!(dias > 0 && dias <= DIAS_QUINCENA)) {
        throw new AppError(`dias_trabajados de ${empleado.codigo_empleado} debe estar entre 1 y ${DIAS_QUINCENA}`, 400);
      }
      monto = calcularAdministrativo(empleado, dias, calculoAdmin.porcentajes, calculoAdmin.tramos);
    } else {
      monto = calcularCampo(empleado, linea);
    }
    return {
      empleado_id: empleado.id,
      codigo_empleado: empleado.codigo_empleado,
      empleado: `${empleado.nombres} ${empleado.apellidos}`,
      ...monto,
    };
  });

  const sumar = (campo) => redondear(detalles.reduce((total, d) => total + d[campo], 0));
  const totales = {
    total_devengado: sumar('salario_devengado'),
    total_deducciones: redondear(sumar('descuento_isss') + sumar('descuento_afp') + sumar('descuento_isr')),
    total_neto: sumar('salario_neto'),
  };

  return { cabecera, detalles, totales };
};

// ---- Casos de uso ------------------------------------------------------------------

const vistaPrevia = async (entrada) => {
  const { cabecera, detalles, totales } = await calcular(entrada);
  return { ...cabecera, ...totales, detalles };
};

const obtener = async (id) => {
  const planilla = await model.obtenerPorId(id);
  if (!planilla) throw new AppError('Planilla no encontrada', 404);
  const detalles = await model.detallesDePlanilla(id);
  return { ...planilla, detalles };
};

const crear = async (entrada) => {
  const { cabecera, detalles, totales } = await calcular(entrada);

  const traslape = await model.existeTraslape(cabecera.tipo_planilla, cabecera.periodo_inicio, cabecera.periodo_fin);
  if (traslape) {
    throw new AppError(`El período se traslapa con la planilla ${traslape.codigo_planilla}`, 409);
  }

  const id = await model.crearCompleta(cabecera, detalles, totales, TIPOS[cabecera.tipo_planilla].prefijo);
  return obtener(id);
};

const listar = async (query = {}) => {
  if (query.tipo && !TIPOS[query.tipo]) {
    throw new AppError(`tipo debe ser: ${Object.keys(TIPOS).join(', ')}`, 400);
  }
  return model.listar({ tipo: query.tipo, estado: query.estado });
};

// BORRADOR -> APROBADA -> PAGADA (no se puede retroceder)
const cambiarEstado = async (id, estado) => {
  const planilla = await model.obtenerPorId(id);
  if (!planilla) throw new AppError('Planilla no encontrada', 404);

  if (SIGUIENTE_ESTADO[planilla.estado] !== estado) {
    const permitido = SIGUIENTE_ESTADO[planilla.estado];
    throw new AppError(
      permitido
        ? `Una planilla ${planilla.estado} solo puede pasar a ${permitido}`
        : `La planilla ya está ${planilla.estado} y no admite más cambios`,
      409
    );
  }
  await model.actualizarEstado(id, estado);
  return obtener(id);
};

const eliminar = async (id) => {
  const planilla = await model.obtenerPorId(id);
  if (!planilla) throw new AppError('Planilla no encontrada', 404);
  if (planilla.estado !== 'BORRADOR') {
    throw new AppError('Solo se pueden eliminar planillas en BORRADOR', 409);
  }
  await model.eliminar(id);
};

const obtenerBoleta = async (id) => {
  const boleta = await model.obtenerBoleta(id);
  if (!boleta) throw new AppError('Boleta no encontrada', 404);
  return boleta;
};

const boletasDeEmpleado = (empleadoId) => model.boletasDeEmpleado(empleadoId);

module.exports = {
  vistaPrevia, crear, listar, obtener, cambiarEstado, eliminar, obtenerBoleta, boletasDeEmpleado,
};
