-- ============================================================================
-- BASE DE DATOS: ERP INMOBILIARIA Y CONSTRUCTORA SV (PostgreSQL)
-- Uso:  psql -U postgres -d constructora_erp_sv -f schema.sql
-- Para reiniciar el entorno de PRUEBAS 
--   DROP SCHEMA public CASCADE;
--   CREATE SCHEMA public;
--
-- NOTA: las fases usan 'DISENO' (sin ñ) para evitar problemas de codificación.
-- ============================================================================

-- ============================================================================
-- MÓDULO 1: PLANIFICACIÓN Y PERMISOLOGÍA
-- ============================================================================

CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo_proyecto VARCHAR(30) NOT NULL CHECK (tipo_proyecto IN ('CASAS_SERIE', 'APARTAMENTOS')),
    ubicacion TEXT NOT NULL,
    fase_actual VARCHAR(20) NOT NULL DEFAULT 'DISENO'
        CHECK (fase_actual IN ('DISENO', 'TERRACERIA', 'OBRA_GRIS', 'ACABADOS', 'FINALIZADO')),
    estado VARCHAR(20) NOT NULL DEFAULT 'PLANIFICACION'
        CHECK (estado IN ('PLANIFICACION', 'EN_EJECUCION', 'SUSPENDIDO', 'FINALIZADO')),
    presupuesto_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    fecha_inicio_estimada DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permisos_proyecto (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    entidad VARCHAR(20) NOT NULL CHECK (entidad IN ('OPAMSS', 'MARN', 'ANDA')),
    numero_resolucion VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO')),
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_aprobacion DATE,
    observaciones TEXT,
    UNIQUE (proyecto_id, entidad)
);

-- TRIGGER BLOQUEANTE: impide iniciar obras (salir de DISENO o pasar a EN_EJECUCION)
-- si OPAMSS, MARN y ANDA no están en estado 'APROBADO'.
-- Se valida en INSERT y UPDATE, y solo cuando cambia la fase o el estado.
CREATE OR REPLACE FUNCTION fn_validar_permisos_inicio_obra()
RETURNS TRIGGER AS $$
DECLARE
    permisos_aprobados INT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.fase_actual = OLD.fase_actual AND NEW.estado = OLD.estado THEN
            RETURN NEW;
        END IF;
    END IF;

    IF NEW.fase_actual <> 'DISENO' OR NEW.estado = 'EN_EJECUCION' THEN
        SELECT COUNT(*)
        INTO permisos_aprobados
        FROM permisos_proyecto
        WHERE proyecto_id = NEW.id
          AND entidad IN ('OPAMSS', 'MARN', 'ANDA')
          AND estado = 'APROBADO';

        IF permisos_aprobados < 3 THEN
            RAISE EXCEPTION 'BLOQUEO DE PERMISOLOGÍA: El proyecto "%" no puede iniciar obras sin tener APROBADOS los 3 permisos obligatorios (OPAMSS, MARN y ANDA). Aprobados actuales: %/3.',
                NEW.nombre, permisos_aprobados;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_permisos_obra
BEFORE INSERT OR UPDATE ON proyectos
FOR EACH ROW
EXECUTE FUNCTION fn_validar_permisos_inicio_obra();

-- TRIGGER DE PROTECCIÓN: no se puede quitar la aprobación de un permiso
-- si el proyecto ya inició obras.
CREATE OR REPLACE FUNCTION fn_proteger_permisos_en_ejecucion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado = 'APROBADO' AND NEW.estado <> 'APROBADO' THEN
        IF EXISTS (
            SELECT 1 FROM proyectos
            WHERE id = NEW.proyecto_id
              AND (estado = 'EN_EJECUCION' OR fase_actual <> 'DISENO')
        ) THEN
            RAISE EXCEPTION 'No se puede revocar el permiso % : el proyecto ya inició obras.', NEW.entidad;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proteger_permisos
BEFORE UPDATE ON permisos_proyecto
FOR EACH ROW
EXECUTE FUNCTION fn_proteger_permisos_en_ejecucion();


-- ============================================================================
-- MÓDULO 2: BODEGA E INVENTARIO MULTI-SITIO
-- ============================================================================

CREATE TABLE bodegas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CENTRAL', 'PROYECTO')),
    proyecto_id INT UNIQUE REFERENCES proyectos(id) ON DELETE CASCADE,
    ubicacion VARCHAR(150),
    CHECK (
        (tipo = 'CENTRAL' AND proyecto_id IS NULL) OR
        (tipo = 'PROYECTO' AND proyecto_id IS NOT NULL)
    )
);

CREATE TABLE materiales (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL, -- Ej: BOLSA, M3, QUINTAL, UNIDAD, GALON
    costo_unitario NUMERIC(12, 2) NOT NULL CHECK (costo_unitario >= 0),
    stock_minimo NUMERIC(10, 2) NOT NULL DEFAULT 10.00
);

CREATE TABLE inventario_bodega (
    id SERIAL PRIMARY KEY,
    bodega_id INT NOT NULL REFERENCES bodegas(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materiales(id) ON DELETE RESTRICT,
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (stock_actual >= 0),
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bodega_id, material_id)
);

-- Kardex: historial de movimientos con saldo resultante
CREATE TABLE kardex_movimientos (
    id SERIAL PRIMARY KEY,
    bodega_id INT NOT NULL REFERENCES bodegas(id),
    material_id INT NOT NULL REFERENCES materiales(id),
    tipo_movimiento VARCHAR(25) NOT NULL
        CHECK (tipo_movimiento IN ('ENTRADA_COMPRA', 'TRASLADO_SALIDA', 'TRASLADO_ENTRADA', 'CONSUMO_OBRA')),
    cantidad NUMERIC(12, 2) NOT NULL,
    saldo_resultante NUMERIC(12, 2) NOT NULL,
    referencia_id INT, -- ID del ingreso, traslado o reporte_avance según el tipo
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---- INGRESOS A BODEGA CENTRAL (compras de material) ----------------------

CREATE TABLE ingresos_bodega (
    id SERIAL PRIMARY KEY,
    codigo_ingreso VARCHAR(30) UNIQUE NOT NULL,
    bodega_id INT NOT NULL REFERENCES bodegas(id),
    proveedor VARCHAR(120) NOT NULL,
    numero_documento VARCHAR(50), -- Factura o CCF del proveedor
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responsable VARCHAR(100) NOT NULL,
    observaciones TEXT
);

CREATE TABLE detalle_ingresos (
    id SERIAL PRIMARY KEY,
    ingreso_id INT NOT NULL REFERENCES ingresos_bodega(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materiales(id),
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC(12, 2) NOT NULL CHECK (costo_unitario >= 0)
);

-- Los ingresos solo pueden hacerse a la bodega CENTRAL
CREATE OR REPLACE FUNCTION fn_validar_ingreso_bodega()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo VARCHAR(20);
BEGIN
    SELECT tipo INTO v_tipo FROM bodegas WHERE id = NEW.bodega_id;
    IF v_tipo IS DISTINCT FROM 'CENTRAL' THEN
        RAISE EXCEPTION 'Los ingresos de material solo pueden registrarse en la bodega CENTRAL.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_ingreso_bodega
BEFORE INSERT ON ingresos_bodega
FOR EACH ROW
EXECUTE FUNCTION fn_validar_ingreso_bodega();

-- Suma el material a la bodega y registra el kardex
CREATE OR REPLACE FUNCTION fn_procesar_detalle_ingreso()
RETURNS TRIGGER AS $$
DECLARE
    v_bodega_id INT;
    v_saldo NUMERIC(12, 2);
BEGIN
    SELECT bodega_id INTO v_bodega_id FROM ingresos_bodega WHERE id = NEW.ingreso_id;

    INSERT INTO inventario_bodega (bodega_id, material_id, stock_actual)
    VALUES (v_bodega_id, NEW.material_id, NEW.cantidad)
    ON CONFLICT (bodega_id, material_id)
    DO UPDATE SET stock_actual = inventario_bodega.stock_actual + EXCLUDED.stock_actual,
                  ultima_actualizacion = CURRENT_TIMESTAMP
    RETURNING stock_actual INTO v_saldo;

    INSERT INTO kardex_movimientos (bodega_id, material_id, tipo_movimiento, cantidad, saldo_resultante, referencia_id)
    VALUES (v_bodega_id, NEW.material_id, 'ENTRADA_COMPRA', NEW.cantidad, v_saldo, NEW.ingreso_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_procesar_detalle_ingreso
AFTER INSERT ON detalle_ingresos
FOR EACH ROW
EXECUTE FUNCTION fn_procesar_detalle_ingreso();

-- ---- TRASLADOS (central -> proyecto) ---------------------------------------

CREATE TABLE traslados (
    id SERIAL PRIMARY KEY,
    codigo_traslado VARCHAR(30) UNIQUE NOT NULL,
    bodega_origen_id INT NOT NULL REFERENCES bodegas(id),
    bodega_destino_id INT NOT NULL REFERENCES bodegas(id),
    fecha_traslado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responsable VARCHAR(100) NOT NULL,
    observaciones TEXT,
    CHECK (bodega_origen_id <> bodega_destino_id)
);

CREATE TABLE detalle_traslados (
    id SERIAL PRIMARY KEY,
    traslado_id INT NOT NULL REFERENCES traslados(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materiales(id),
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0)
);

-- Solo se permiten traslados de la bodega CENTRAL a una bodega de PROYECTO
CREATE OR REPLACE FUNCTION fn_validar_traslado()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo_origen VARCHAR(20);
    v_tipo_destino VARCHAR(20);
BEGIN
    SELECT tipo INTO v_tipo_origen FROM bodegas WHERE id = NEW.bodega_origen_id;
    SELECT tipo INTO v_tipo_destino FROM bodegas WHERE id = NEW.bodega_destino_id;

    IF v_tipo_origen IS DISTINCT FROM 'CENTRAL' OR v_tipo_destino IS DISTINCT FROM 'PROYECTO' THEN
        RAISE EXCEPTION 'Los traslados deben ir de la bodega CENTRAL a una bodega de PROYECTO.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_traslado
BEFORE INSERT ON traslados
FOR EACH ROW
EXECUTE FUNCTION fn_validar_traslado();

-- Descuenta de la bodega origen (de forma atómica), suma al destino y registra kardex
CREATE OR REPLACE FUNCTION fn_procesar_detalle_traslado()
RETURNS TRIGGER AS $$
DECLARE
    v_origen_id INT;
    v_destino_id INT;
    v_saldo_origen NUMERIC(12, 2);
    v_saldo_destino NUMERIC(12, 2);
    v_disponible NUMERIC(12, 2);
BEGIN
    SELECT bodega_origen_id, bodega_destino_id
    INTO v_origen_id, v_destino_id
    FROM traslados
    WHERE id = NEW.traslado_id;

    -- Solo descuenta si hay stock suficiente (evita condiciones de carrera)
    UPDATE inventario_bodega
    SET stock_actual = stock_actual - NEW.cantidad,
        ultima_actualizacion = CURRENT_TIMESTAMP
    WHERE bodega_id = v_origen_id
      AND material_id = NEW.material_id
      AND stock_actual >= NEW.cantidad
    RETURNING stock_actual INTO v_saldo_origen;

    IF NOT FOUND THEN
        v_disponible := COALESCE((
            SELECT stock_actual FROM inventario_bodega
            WHERE bodega_id = v_origen_id AND material_id = NEW.material_id
        ), 0);
        RAISE EXCEPTION 'Stock insuficiente en bodega origen (ID %) para el material ID %. Disponible: %, Solicitado: %',
            v_origen_id, NEW.material_id, v_disponible, NEW.cantidad;
    END IF;

    INSERT INTO inventario_bodega (bodega_id, material_id, stock_actual)
    VALUES (v_destino_id, NEW.material_id, NEW.cantidad)
    ON CONFLICT (bodega_id, material_id)
    DO UPDATE SET stock_actual = inventario_bodega.stock_actual + EXCLUDED.stock_actual,
                  ultima_actualizacion = CURRENT_TIMESTAMP
    RETURNING stock_actual INTO v_saldo_destino;

    INSERT INTO kardex_movimientos (bodega_id, material_id, tipo_movimiento, cantidad, saldo_resultante, referencia_id)
    VALUES
        (v_origen_id,  NEW.material_id, 'TRASLADO_SALIDA',  NEW.cantidad, v_saldo_origen,  NEW.traslado_id),
        (v_destino_id, NEW.material_id, 'TRASLADO_ENTRADA', NEW.cantidad, v_saldo_destino, NEW.traslado_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_procesar_detalle_traslado
AFTER INSERT ON detalle_traslados
FOR EACH ROW
EXECUTE FUNCTION fn_procesar_detalle_traslado();

-- Los detalles de traslado no se editan ni se borran (el inventario ya fue afectado)
CREATE OR REPLACE FUNCTION fn_bloquear_modif_detalle_traslado()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Los detalles de traslado no se pueden modificar ni eliminar.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_modif_detalle_traslado
BEFORE UPDATE OR DELETE ON detalle_traslados
FOR EACH ROW
EXECUTE FUNCTION fn_bloquear_modif_detalle_traslado();


-- ============================================================================
-- MÓDULO 4: RECURSOS HUMANOS (PLANILLA ADMINISTRATIVA VS. CAMPO)
-- (Se crea antes del Módulo 3 para referenciar ingenieros residentes)
-- ============================================================================

CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    codigo_empleado VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    dui VARCHAR(10) UNIQUE NOT NULL,
    cargo VARCHAR(80) NOT NULL, -- Ej: Ingeniero Residente, Albañil, Contador, Asesor Ventas
    tipo_empleado VARCHAR(20) NOT NULL CHECK (tipo_empleado IN ('ADMINISTRATIVO', 'CAMPO')),
    modalidad_pago_campo VARCHAR(20) CHECK (modalidad_pago_campo IN ('POR_DIA', 'DESTAJO')),
    es_ingeniero BOOLEAN NOT NULL DEFAULT FALSE, -- Puede reportar avances de obra
    salario_mensual NUMERIC(10, 2) DEFAULT 0.00, -- Para administrativos
    tarifa_campo NUMERIC(10, 2) DEFAULT 0.00,    -- Tarifa por día o por unidad de obra
    proyecto_asignado_id INT REFERENCES proyectos(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (
        (tipo_empleado = 'ADMINISTRATIVO' AND modalidad_pago_campo IS NULL) OR
        (tipo_empleado = 'CAMPO' AND modalidad_pago_campo IS NOT NULL)
    )
);

-- Parámetros legales de planilla (editables sin tocar el código)
CREATE TABLE parametros_planilla (
    clave VARCHAR(40) PRIMARY KEY,
    valor NUMERIC(10, 4) NOT NULL,
    descripcion VARCHAR(150)
);

INSERT INTO parametros_planilla (clave, valor, descripcion) VALUES
    ('ISSS_EMPLEADO_PCT', 3.00, 'Descuento ISSS al empleado (%)'),
    ('AFP_EMPLEADO_PCT', 7.25, 'Descuento AFP al empleado (%)');

-- Tablas de retención de Impuesto sobre la Renta
-- IMPORTANTE: verificar los valores con la tabla vigente del Ministerio de Hacienda.
-- Cálculo: ISR = cuota_fija + (base - exceso_sobre) * porcentaje / 100
-- hasta NULL = sin límite superior. El tramo exento tiene porcentaje 0 y cuota 0.
CREATE TABLE tramos_renta (
    id SERIAL PRIMARY KEY,
    periodo VARCHAR(10) NOT NULL CHECK (periodo IN ('QUINCENAL', 'MENSUAL')),
    tramo INT NOT NULL,
    desde NUMERIC(10, 2) NOT NULL,
    hasta NUMERIC(10, 2),
    porcentaje NUMERIC(5, 2) NOT NULL,
    exceso_sobre NUMERIC(10, 2) NOT NULL,
    cuota_fija NUMERIC(10, 2) NOT NULL,
    UNIQUE (periodo, tramo)
);

INSERT INTO tramos_renta (periodo, tramo, desde, hasta, porcentaje, exceso_sobre, cuota_fija) VALUES
    ('QUINCENAL', 1,    0.01,   236.00,  0.00,    0.00,    0.00),
    ('QUINCENAL', 2,  236.01,   447.62, 10.00,  236.00,    8.83),
    ('QUINCENAL', 3,  447.63,  1019.05, 20.00,  447.62,   30.00),
    ('QUINCENAL', 4, 1019.06,     NULL, 30.00, 1019.05,  144.28),
    ('MENSUAL',   1,    0.01,   472.00,  0.00,    0.00,    0.00),
    ('MENSUAL',   2,  472.01,   895.24, 10.00,  472.00,   17.67),
    ('MENSUAL',   3,  895.25,  2038.10, 20.00,  895.24,   60.00),
    ('MENSUAL',   4, 2038.11,     NULL, 30.00, 2038.10,  288.57);

CREATE TABLE planillas (
    id SERIAL PRIMARY KEY,
    codigo_planilla VARCHAR(30) UNIQUE NOT NULL,
    tipo_planilla VARCHAR(30) NOT NULL
        CHECK (tipo_planilla IN ('ADMINISTRATIVA_QUINCENAL', 'CAMPO_SEMANAL')),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    fecha_pago DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'APROBADA', 'PAGADA')),
    total_devengado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_deducciones NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_neto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    CHECK (periodo_fin >= periodo_inicio)
);

CREATE TABLE detalle_planilla (
    id SERIAL PRIMARY KEY,
    planilla_id INT NOT NULL REFERENCES planillas(id) ON DELETE CASCADE,
    empleado_id INT NOT NULL REFERENCES empleados(id),
    numero_boleta VARCHAR(30) UNIQUE NOT NULL,
    -- Campos para personal de campo
    dias_trabajados NUMERIC(5, 2) DEFAULT 0.00,
    unidades_destajo NUMERIC(10, 2) DEFAULT 0.00,
    -- Montos calculados
    salario_devengado NUMERIC(10, 2) NOT NULL,
    descuento_isss NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- 3% (Admin)
    descuento_afp NUMERIC(10, 2) NOT NULL DEFAULT 0.00,  -- 7.25% (Admin)
    descuento_isr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,  -- Renta según tabla vigente SV
    salario_neto NUMERIC(10, 2) NOT NULL,
    UNIQUE (planilla_id, empleado_id),
    CHECK (salario_neto = salario_devengado - descuento_isss - descuento_afp - descuento_isr)
);


-- ============================================================================
-- SEGURIDAD: ROLES Y USUARIOS (LOGIN JWT Y CONTROL DE ACCESO POR ROL)
-- ============================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(40) UNIQUE NOT NULL,
    descripcion VARCHAR(150)
);

INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN', 'Administrador general del sistema'),
    ('GERENTE_PROYECTO', 'Gestión de proyectos y aprobación de permisología'),
    ('INGENIERO_RESIDENTE', 'Reporta avances de obra y consumo de partidas'),
    ('BODEGUERO', 'Gestión de bodega central, ingresos y traslados'),
    ('RRHH', 'Gestión de empleados y cálculo de planillas'),
    ('VENTAS', 'CRM inmobiliario, cierre de ventas y facturación');

-- empleado_id es opcional: permite usuarios que no son empleados (ej. administrador externo).
-- El login acepta username o correo, por eso el username no puede contener '@'.
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    empleado_id INT UNIQUE REFERENCES empleados(id) ON DELETE SET NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Hash generado con bcryptjs, nunca texto plano
    rol_id INT NOT NULL REFERENCES roles(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_username_sin_arroba CHECK (username !~ '@'),
    CONSTRAINT chk_correo_formato CHECK (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Unicidad sin distinguir mayúsculas/minúsculas 
CREATE UNIQUE INDEX uq_usuarios_username_lower ON usuarios (LOWER(username));
CREATE UNIQUE INDEX uq_usuarios_correo_lower   ON usuarios (LOWER(correo));

-- Los roles que operan con datos de empleado (obra y ventas) requieren un empleado asociado
CREATE OR REPLACE FUNCTION fn_validar_usuario_rol()
RETURNS TRIGGER AS $$
DECLARE
    v_rol VARCHAR(40);
BEGIN
    SELECT nombre INTO v_rol FROM roles WHERE id = NEW.rol_id;

    IF v_rol IN ('INGENIERO_RESIDENTE', 'VENTAS') AND NEW.empleado_id IS NULL THEN
        RAISE EXCEPTION 'El rol % requiere un empleado asociado.', v_rol;
    END IF;

    IF v_rol = 'INGENIERO_RESIDENTE' AND NOT EXISTS (
        SELECT 1 FROM empleados WHERE id = NEW.empleado_id AND es_ingeniero
    ) THEN
        RAISE EXCEPTION 'El empleado asociado debe estar marcado como ingeniero.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_usuario_rol
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_validar_usuario_rol();


-- ============================================================================
-- MÓDULO 3: EJECUCIÓN Y PARTIDAS DE OBRA
-- ============================================================================

CREATE TABLE partidas_obra (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    fase VARCHAR(20) NOT NULL CHECK (fase IN ('TERRACERIA', 'OBRA_GRIS', 'ACABADOS')),
    codigo_partida VARCHAR(30) NOT NULL,
    nombre VARCHAR(150) NOT NULL, -- Ej: Fundición de losa nivel 1
    porcentaje_avance NUMERIC(5, 2) NOT NULL DEFAULT 0.00
        CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    costo_materiales_acumulado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    UNIQUE (proyecto_id, codigo_partida)
);

-- Define cuánto material requiere la partida al completarse al 100%
CREATE TABLE receta_partida_materiales (
    id SERIAL PRIMARY KEY,
    partida_id INT NOT NULL REFERENCES partidas_obra(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materiales(id),
    cantidad_total_requerida NUMERIC(12, 2) NOT NULL CHECK (cantidad_total_requerida > 0),
    UNIQUE (partida_id, material_id)
);

CREATE TABLE reportes_avance (
    id SERIAL PRIMARY KEY,
    partida_id INT NOT NULL REFERENCES partidas_obra(id) ON DELETE CASCADE,
    ingeniero_id INT NOT NULL REFERENCES empleados(id),
    fecha_reporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    porcentaje_anterior NUMERIC(5, 2) NOT NULL,
    porcentaje_nuevo NUMERIC(5, 2) NOT NULL CHECK (porcentaje_nuevo > porcentaje_anterior AND porcentaje_nuevo <= 100),
    costo_calculado_avance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    observaciones TEXT
);

CREATE TABLE consumos_material_avance (
    id SERIAL PRIMARY KEY,
    reporte_avance_id INT NOT NULL REFERENCES reportes_avance(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materiales(id),
    cantidad_consumida NUMERIC(12, 2) NOT NULL,
    costo_unitario_aplicado NUMERIC(12, 2) NOT NULL,
    subtotal_costo NUMERIC(12, 2) NOT NULL
);

-- TRIGGER DE AVANCE: al reportar un avance calcula el material consumido según la
-- receta de la partida, descuenta la bodega del proyecto, registra el kardex y
-- acumula el costo en la partida.
-- Ejemplo: receta de 100 bolsas de cemento; avance de 0% a 50% => descuenta 50 bolsas.
CREATE OR REPLACE FUNCTION fn_procesar_avance_obra()
RETURNS TRIGGER AS $$
DECLARE
    v_proyecto_id INT;
    v_pct_actual  NUMERIC(5, 2);
    v_estado      VARCHAR(20);
    v_bodega_id   INT;
    v_delta       NUMERIC(5, 2);
    v_cant        NUMERIC(12, 2);
    v_costo       NUMERIC(12, 2);
    v_saldo       NUMERIC(12, 2);
    v_total       NUMERIC(12, 2) := 0;
    r             RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM empleados
        WHERE id = NEW.ingeniero_id AND es_ingeniero AND activo
    ) THEN
        RAISE EXCEPTION 'El empleado ID % no es un ingeniero activo autorizado para reportar avances.', NEW.ingeniero_id;
    END IF;

    SELECT p.proyecto_id, p.porcentaje_avance
    INTO v_proyecto_id, v_pct_actual
    FROM partidas_obra p
    WHERE p.id = NEW.partida_id
    FOR UPDATE;

    IF NEW.porcentaje_anterior <> v_pct_actual THEN
        RAISE EXCEPTION 'El porcentaje anterior (%) no coincide con el avance actual de la partida (%).',
            NEW.porcentaje_anterior, v_pct_actual;
    END IF;

    SELECT estado INTO v_estado FROM proyectos WHERE id = v_proyecto_id;
    IF v_estado <> 'EN_EJECUCION' THEN
        RAISE EXCEPTION 'No se puede reportar avance: el proyecto no está EN_EJECUCION.';
    END IF;

    SELECT id INTO v_bodega_id FROM bodegas WHERE proyecto_id = v_proyecto_id;
    IF v_bodega_id IS NULL THEN
        RAISE EXCEPTION 'El proyecto no tiene bodega asignada.';
    END IF;

    v_delta := NEW.porcentaje_nuevo - NEW.porcentaje_anterior;

    FOR r IN
        SELECT rp.material_id, rp.cantidad_total_requerida, m.costo_unitario
        FROM receta_partida_materiales rp
        JOIN materiales m ON m.id = rp.material_id
        WHERE rp.partida_id = NEW.partida_id
    LOOP
        v_cant  := ROUND(r.cantidad_total_requerida * v_delta / 100, 2);
        v_costo := ROUND(v_cant * r.costo_unitario, 2);

        UPDATE inventario_bodega
        SET stock_actual = stock_actual - v_cant,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE bodega_id = v_bodega_id
          AND material_id = r.material_id
          AND stock_actual >= v_cant
        RETURNING stock_actual INTO v_saldo;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Stock insuficiente en la bodega del proyecto para el material ID % (requerido: %).',
                r.material_id, v_cant;
        END IF;

        INSERT INTO consumos_material_avance
            (reporte_avance_id, material_id, cantidad_consumida, costo_unitario_aplicado, subtotal_costo)
        VALUES (NEW.id, r.material_id, v_cant, r.costo_unitario, v_costo);

        INSERT INTO kardex_movimientos (bodega_id, material_id, tipo_movimiento, cantidad, saldo_resultante, referencia_id)
        VALUES (v_bodega_id, r.material_id, 'CONSUMO_OBRA', v_cant, v_saldo, NEW.id);

        v_total := v_total + v_costo;
    END LOOP;

    UPDATE partidas_obra
    SET porcentaje_avance = NEW.porcentaje_nuevo,
        costo_materiales_acumulado = costo_materiales_acumulado + v_total
    WHERE id = NEW.partida_id;

    UPDATE reportes_avance SET costo_calculado_avance = v_total WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_procesar_avance_obra
AFTER INSERT ON reportes_avance
FOR EACH ROW
EXECUTE FUNCTION fn_procesar_avance_obra();


-- ============================================================================
-- MÓDULO 5: VENTAS E INMOBILIARIA (CRM, PLAN DE PAGOS Y FACTURACIÓN)
-- ============================================================================

CREATE TABLE unidades_inmobiliarias (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo_unidad VARCHAR(30) NOT NULL, -- Ej: CASA-A12, APTO-402
    tipo_unidad VARCHAR(20) NOT NULL CHECK (tipo_unidad IN ('CASA', 'APARTAMENTO')),
    area_m2 NUMERIC(8, 2) NOT NULL,
    habitaciones INT NOT NULL DEFAULT 2,
    precio_venta NUMERIC(14, 2) NOT NULL CHECK (precio_venta > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
        CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'VENDIDA')),
    UNIQUE (proyecto_id, codigo_unidad)
);

CREATE TABLE clientes_crm (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    dui VARCHAR(10) UNIQUE,
    nit VARCHAR(17),
    nrc VARCHAR(20), -- Requerido si solicita Comprobante de Crédito Fiscal (CCF)
    giro_economico VARCHAR(120),
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(120),
    estado_embudo VARCHAR(25) NOT NULL DEFAULT 'PROSPECTO'
        CHECK (estado_embudo IN ('PROSPECTO', 'CONTACTADO', 'VISITA_AGENDADA', 'COTIZADO', 'CERRADO_GANADO', 'DESCARTADO')),
    proyecto_interes_id INT REFERENCES proyectos(id) ON DELETE SET NULL,
    asesor_id INT REFERENCES empleados(id) ON DELETE SET NULL,
    notas_seguimiento TEXT,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ventas_inmobiliarias (
    id SERIAL PRIMARY KEY,
    numero_contrato VARCHAR(30) UNIQUE NOT NULL,
    unidad_id INT UNIQUE NOT NULL REFERENCES unidades_inmobiliarias(id),
    cliente_id INT NOT NULL REFERENCES clientes_crm(id),
    asesor_id INT NOT NULL REFERENCES empleados(id),
    fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
    precio_acordado NUMERIC(14, 2) NOT NULL,
    monto_prima NUMERIC(14, 2) NOT NULL CHECK (monto_prima >= 0),
    monto_financiar NUMERIC(14, 2) NOT NULL CHECK (monto_financiar >= 0),
    tasa_interes_anual NUMERIC(5, 2) NOT NULL DEFAULT 7.50 CHECK (tasa_interes_anual >= 0),
    plazo_meses INT NOT NULL CHECK (plazo_meses > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'LIQUIDADA', 'ANULADA')),
    CONSTRAINT chk_venta_montos CHECK (precio_acordado = monto_prima + monto_financiar)
);

CREATE TABLE plan_pagos_cuotas (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES ventas_inmobiliarias(id) ON DELETE CASCADE,
    numero_cuota INT NOT NULL, -- 0 = Prima, 1..N = Cuotas mensuales
    tipo_cuota VARCHAR(20) NOT NULL CHECK (tipo_cuota IN ('PRIMA', 'CUOTA_MENSUAL')),
    fecha_vencimiento DATE NOT NULL,
    monto_capital NUMERIC(12, 2) NOT NULL,
    monto_interes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_total_cuota NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADA', 'VENCIDA')),
    UNIQUE (venta_id, numero_cuota)
);

CREATE TABLE facturas_abonos (
    id SERIAL PRIMARY KEY,
    cuota_id INT UNIQUE NOT NULL REFERENCES plan_pagos_cuotas(id),
    venta_id INT NOT NULL REFERENCES ventas_inmobiliarias(id),
    cliente_id INT NOT NULL REFERENCES clientes_crm(id),
    tipo_documento VARCHAR(30) NOT NULL
        CHECK (tipo_documento IN ('RECIBO', 'FACTURA_CONSUMIDOR_FINAL', 'CCF')),
    numero_correlativo VARCHAR(30) UNIQUE NOT NULL, -- Se genera automáticamente si no se envía
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concepto VARCHAR(200) NOT NULL,
    subtotal_gravado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal_exento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    iva_13 NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_pagado NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL
        CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'FINANCIAMIENTO_BANCARIO')),
    CONSTRAINT chk_factura_total CHECK (total_pagado = subtotal_gravado + subtotal_exento + iva_13)
);

-- ---- CORRELATIVOS DE DOCUMENTOS --------------------------------------------

CREATE SEQUENCE seq_correlativo_recibo START 1;
CREATE SEQUENCE seq_correlativo_factura_cf START 1;
CREATE SEQUENCE seq_correlativo_ccf START 1;

CREATE OR REPLACE FUNCTION fn_siguiente_correlativo(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF p_tipo = 'RECIBO' THEN
        RETURN 'REC-' || LPAD(nextval('seq_correlativo_recibo')::TEXT, 8, '0');
    ELSIF p_tipo = 'FACTURA_CONSUMIDOR_FINAL' THEN
        RETURN 'FCF-' || LPAD(nextval('seq_correlativo_factura_cf')::TEXT, 8, '0');
    ELSIF p_tipo = 'CCF' THEN
        RETURN 'CCF-' || LPAD(nextval('seq_correlativo_ccf')::TEXT, 8, '0');
    ELSE
        RAISE EXCEPTION 'Tipo de documento no válido: %', p_tipo;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ---- GENERACIÓN DEL PLAN DE PAGOS (prima + cuotas fijas, sistema francés) ----
-- cuota = P * i / (1 - (1 + i)^-n), con i = tasa anual / 12 / 100 y n = plazo en meses.
-- La última cuota ajusta el capital para saldar exactamente el financiamiento.
CREATE OR REPLACE FUNCTION fn_generar_plan_pagos(p_venta_id INT)
RETURNS VOID AS $$
DECLARE
    v       ventas_inmobiliarias%ROWTYPE;
    i       NUMERIC;
    cuota   NUMERIC(12, 2);
    saldo   NUMERIC(14, 2);
    interes NUMERIC(12, 2);
    capital NUMERIC(12, 2);
    k       INT;
BEGIN
    SELECT * INTO v FROM ventas_inmobiliarias WHERE id = p_venta_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La venta ID % no existe.', p_venta_id;
    END IF;

    -- Cuota 0: prima. Si la prima es $0 no hay nada que cobrar: no se crea la cuota
    -- (así no se obliga a emitir un documento de $0 antes de poder cobrar la cuota 1).
    IF v.monto_prima > 0 THEN
        INSERT INTO plan_pagos_cuotas
            (venta_id, numero_cuota, tipo_cuota, fecha_vencimiento, monto_capital, monto_interes, monto_total_cuota)
        VALUES (v.id, 0, 'PRIMA', v.fecha_venta, v.monto_prima, 0, v.monto_prima);
    END IF;

    saldo := v.monto_financiar;
    IF saldo <= 0 THEN
        RETURN;
    END IF;

    i := v.tasa_interes_anual / 12 / 100;

    IF i = 0 THEN
        cuota := ROUND(saldo / v.plazo_meses, 2);
    ELSE
        cuota := ROUND(saldo * i / (1 - POWER(1 + i, -v.plazo_meses)), 2);
    END IF;

    FOR k IN 1..v.plazo_meses LOOP
        interes := ROUND(saldo * i, 2);
        IF k = v.plazo_meses THEN
            capital := saldo;
        ELSE
            capital := cuota - interes;
        END IF;
        saldo := saldo - capital;

        INSERT INTO plan_pagos_cuotas
            (venta_id, numero_cuota, tipo_cuota, fecha_vencimiento, monto_capital, monto_interes, monto_total_cuota)
        VALUES (v.id, k, 'CUOTA_MENSUAL',
                (v.fecha_venta + make_interval(months => k))::DATE,
                capital, interes, capital + interes);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Al registrar una venta: marca la unidad como vendida, cierra al cliente en el CRM
-- y genera el plan de pagos automáticamente.
CREATE OR REPLACE FUNCTION fn_procesar_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_estado_unidad VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado_unidad
    FROM unidades_inmobiliarias
    WHERE id = NEW.unidad_id
    FOR UPDATE;

    IF v_estado_unidad = 'VENDIDA' THEN
        RAISE EXCEPTION 'La unidad ID % ya fue vendida.', NEW.unidad_id;
    END IF;

    UPDATE unidades_inmobiliarias SET estado = 'VENDIDA' WHERE id = NEW.unidad_id;
    UPDATE clientes_crm SET estado_embudo = 'CERRADO_GANADO' WHERE id = NEW.cliente_id;

    PERFORM fn_generar_plan_pagos(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_procesar_venta
AFTER INSERT ON ventas_inmobiliarias
FOR EACH ROW
EXECUTE FUNCTION fn_procesar_venta();

-- Antes de emitir un documento: valida coherencia, exige NRC en CCF y asigna correlativo
CREATE OR REPLACE FUNCTION fn_preparar_factura_abono()
RETURNS TRIGGER AS $$
DECLARE
    v_venta_cuota INT;
    v_nrc VARCHAR(20);
BEGIN
    SELECT venta_id INTO v_venta_cuota FROM plan_pagos_cuotas WHERE id = NEW.cuota_id;
    IF v_venta_cuota IS DISTINCT FROM NEW.venta_id THEN
        RAISE EXCEPTION 'La cuota ID % no pertenece a la venta ID %.', NEW.cuota_id, NEW.venta_id;
    END IF;

    IF NEW.tipo_documento = 'CCF' THEN
        SELECT nrc INTO v_nrc FROM clientes_crm WHERE id = NEW.cliente_id;
        IF v_nrc IS NULL OR TRIM(v_nrc) = '' THEN
            RAISE EXCEPTION 'No se puede emitir un CCF: el cliente ID % no tiene NRC registrado.', NEW.cliente_id;
        END IF;
    END IF;

    IF NEW.numero_correlativo IS NULL OR TRIM(NEW.numero_correlativo) = '' THEN
        NEW.numero_correlativo := fn_siguiente_correlativo(NEW.tipo_documento);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_preparar_factura_abono
BEFORE INSERT ON facturas_abonos
FOR EACH ROW
EXECUTE FUNCTION fn_preparar_factura_abono();

-- Después de emitir el documento: marca la cuota como pagada y liquida la venta si no quedan cuotas
CREATE OR REPLACE FUNCTION fn_aplicar_pago_cuota()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE plan_pagos_cuotas SET estado = 'PAGADA' WHERE id = NEW.cuota_id;

    IF NOT EXISTS (
        SELECT 1 FROM plan_pagos_cuotas
        WHERE venta_id = NEW.venta_id AND estado <> 'PAGADA'
    ) THEN
        UPDATE ventas_inmobiliarias SET estado = 'LIQUIDADA' WHERE id = NEW.venta_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aplicar_pago_cuota
AFTER INSERT ON facturas_abonos
FOR EACH ROW
EXECUTE FUNCTION fn_aplicar_pago_cuota();


-- ============================================================================
-- ÍNDICES (PostgreSQL no indexa automáticamente las llaves foráneas)
-- ============================================================================

CREATE INDEX idx_permisos_proyecto       ON permisos_proyecto(proyecto_id);
CREATE INDEX idx_inventario_material     ON inventario_bodega(material_id);
CREATE INDEX idx_kardex_bodega_material  ON kardex_movimientos(bodega_id, material_id);
CREATE INDEX idx_detalle_ingresos_ing    ON detalle_ingresos(ingreso_id);
CREATE INDEX idx_detalle_traslados_tras  ON detalle_traslados(traslado_id);
CREATE INDEX idx_usuarios_rol            ON usuarios(rol_id);
CREATE INDEX idx_partidas_proyecto       ON partidas_obra(proyecto_id);
CREATE INDEX idx_receta_partida          ON receta_partida_materiales(partida_id);
CREATE INDEX idx_reportes_partida        ON reportes_avance(partida_id);
CREATE INDEX idx_consumos_reporte        ON consumos_material_avance(reporte_avance_id);
CREATE INDEX idx_empleados_proyecto      ON empleados(proyecto_asignado_id);
CREATE INDEX idx_detalle_planilla_plan   ON detalle_planilla(planilla_id);
CREATE INDEX idx_unidades_proyecto       ON unidades_inmobiliarias(proyecto_id);
CREATE INDEX idx_clientes_asesor         ON clientes_crm(asesor_id);
CREATE INDEX idx_ventas_cliente          ON ventas_inmobiliarias(cliente_id);
CREATE INDEX idx_cuotas_venta            ON plan_pagos_cuotas(venta_id);
CREATE INDEX idx_facturas_venta          ON facturas_abonos(venta_id);