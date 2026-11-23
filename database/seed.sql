-- ============================================================================
-- DATOS DE PRUEBA INICIALES (SEED) - INMOBILIARIA Y CONSTRUCTORA SV
-- Ejecutar después de schema.sql:
--   psql -U postgres -d constructora_erp_sv -f seed.sql
--
-- IMPORTANTE: este seed requiere una base recién creada (no es idempotente).
-- Para repetirlo: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- y volver a ejecutar schema.sql y seed.sql.
-- ============================================================================

-- ============================================================================
-- 1. MÓDULO 1: PROYECTOS Y PERMISOLOGÍA (OPAMSS, MARN, ANDA)
-- ============================================================================

INSERT INTO proyectos (codigo, nombre, tipo_proyecto, ubicacion, fase_actual, estado, presupuesto_total, fecha_inicio_estimada)
VALUES
('PRJ-001', 'Residencial Altos de Santa Elena', 'CASAS_SERIE', 'Antiguo Cuscatlán, La Libertad', 'DISENO', 'PLANIFICACION', 1250000.00, '2026-12-01'),
('PRJ-002', 'Torre Apartamentos Escalón Norte', 'APARTAMENTOS', 'Colonia Escalón, San Salvador', 'DISENO', 'PLANIFICACION', 2400000.00, '2026-10-15');

-- Proyecto 1: Solo OPAMSS aprobado (MARN y ANDA pendientes -> bloqueado para iniciar obra)
INSERT INTO permisos_proyecto (proyecto_id, entidad, numero_resolucion, estado, fecha_aprobacion, observaciones)
VALUES
(1, 'OPAMSS', 'OP-2026-881', 'APROBADO', '2026-09-10', 'Calificación de lugar y línea de construcción aprobadas.'),
(1, 'MARN', NULL, 'EN_REVISION', NULL, 'Estudio de impacto ambiental en revisión técnica.'),
(1, 'ANDA', NULL, 'PENDIENTE', NULL, 'Pendiente de presentación de planos hidráulicos.');

-- Proyecto 2: Los 3 permisos APROBADOS -> habilitado para pasar a ejecución
INSERT INTO permisos_proyecto (proyecto_id, entidad, numero_resolucion, estado, fecha_aprobacion, observaciones)
VALUES
(2, 'OPAMSS', 'OP-2026-540', 'APROBADO', '2026-08-20', 'Permiso de parcelación y construcción aprobado.'),
(2, 'MARN', 'MARN-DGA-112', 'APROBADO', '2026-09-02', 'Resolución ambiental favorable.'),
(2, 'ANDA', 'ANDA-FACT-309', 'APROBADO', '2026-09-15', 'Factibilidad de agua potable y alcantarillado aprobada.');

-- El trigger trg_validar_permisos_obra valida los 3 permisos y permite iniciar obra en PRJ-002
UPDATE proyectos
SET fase_actual = 'OBRA_GRIS', estado = 'EN_EJECUCION'
WHERE id = 2;


-- ============================================================================
-- 2. MÓDULO 2: BODEGAS, MATERIALES, INGRESOS Y TRASLADOS
-- ============================================================================

INSERT INTO bodegas (nombre, tipo, proyecto_id, ubicacion)
VALUES
('Bodega Central Soyapango', 'CENTRAL', NULL, 'Blvd. del Ejército Nacional, Soyapango'),
('Bodega Obra Santa Elena', 'PROYECTO', 1, 'Antiguo Cuscatlán, La Libertad'),
('Bodega Obra Torre Escalón', 'PROYECTO', 2, 'Colonia Escalón, San Salvador');

INSERT INTO materiales (codigo, nombre, unidad_medida, costo_unitario, stock_minimo)
VALUES
('MAT-001', 'Cemento Portland Gris 42.5kg', 'BOLSA', 8.75, 100.00),
('MAT-002', 'Hierro Corrugado 3/8" Grado 40', 'QUINTAL', 54.00, 30.00),
('MAT-003', 'Arena de Río Lavada', 'M3', 28.50, 20.00),
('MAT-004', 'Bloque de Concreto 15x20x40', 'UNIDAD', 0.85, 500.00),
('MAT-005', 'Pintura Látex Arquitectónica Blanca', 'GALON', 22.00, 15.00);

-- Ingreso inicial a Bodega Central (ID 1)
-- El trigger trg_procesar_detalle_ingreso actualiza inventario_bodega y registra ENTRADA_COMPRA en Kardex
INSERT INTO ingresos_bodega (codigo_ingreso, bodega_id, proveedor, numero_documento, responsable, observaciones)
VALUES
('ING-2026-001', 1, 'Distribuidora de Materiales El Salvador S.A. de C.V.', 'CCF-90451', 'Luis Fernando Castro', 'Abastecimiento inicial de Bodega Central');

INSERT INTO detalle_ingresos (ingreso_id, material_id, cantidad, costo_unitario)
VALUES
(1, 1, 1500.00, 8.75),
(1, 2, 300.00, 54.00),
(1, 3, 250.00, 28.50),
(1, 4, 10000.00, 0.85),
(1, 5, 120.00, 22.00);

-- Traslado de Bodega Central (ID 1) hacia Bodega Obra Torre Escalón (ID 3)
-- El trigger trg_procesar_detalle_traslado descuenta de Central, suma a Proyecto y registra Kardex
INSERT INTO traslados (codigo_traslado, bodega_origen_id, bodega_destino_id, responsable, observaciones)
VALUES
('TRAS-2026-001', 1, 3, 'Carlos Eduardo Mendoza', 'Dotación inicial de materiales para Obra Gris en Torre Escalón');

INSERT INTO detalle_traslados (traslado_id, material_id, cantidad)
VALUES
(1, 1, 400.00),
(1, 2, 80.00),
(1, 3, 60.00),
(1, 4, 2500.00);


-- ============================================================================
-- 3. MÓDULO 4: EMPLEADOS Y PLANILLAS (ADMINISTRATIVA VS. CAMPO)
-- ============================================================================

INSERT INTO empleados (codigo_empleado, nombres, apellidos, dui, cargo, tipo_empleado, modalidad_pago_campo, es_ingeniero, salario_mensual, tarifa_campo, proyecto_asignado_id, activo)
VALUES
('EMP-001', 'Andrea Sofía', 'Vásquez Gómez', '04589123-4', 'Ingeniera Residente', 'ADMINISTRATIVO', NULL, TRUE, 1600.00, 0.00, 2, TRUE),
('EMP-002', 'Roberto Carlos', 'Martínez Pineda', '03214567-8', 'Asesor Inmobiliario', 'ADMINISTRATIVO', NULL, FALSE, 900.00, 0.00, NULL, TRUE),
('EMP-003', 'José Manuel', 'Hernández Cruz', '05123987-1', 'Maestro de Obra', 'CAMPO', 'POR_DIA', FALSE, 0.00, 25.00, 2, TRUE),
('EMP-004', 'Wilber Antonio', 'Ramos López', '06789123-9', 'Albañil Destajista', 'CAMPO', 'DESTAJO', FALSE, 0.00, 12.50, 2, TRUE);

-- Planilla Administrativa Quincenal de ejemplo (Empleado EMP-002: $900/mes -> $450.00 quincenal)
-- ISSS (3%) = $13.50 | AFP (7.25%) = $32.63 | Gravado = $403.87 -> ISR Tramo 2 = $25.62 | Neto = $378.25
INSERT INTO planillas (codigo_planilla, tipo_planilla, periodo_inicio, periodo_fin, fecha_pago, estado, total_devengado, total_deducciones, total_neto)
VALUES
('PLA-ADM-2026-01', 'ADMINISTRATIVA_QUINCENAL', '2026-11-01', '2026-11-15', '2026-11-15', 'PAGADA', 450.00, 71.75, 378.25);

INSERT INTO detalle_planilla (planilla_id, empleado_id, numero_boleta, dias_trabajados, unidades_destajo, salario_devengado, descuento_isss, descuento_afp, descuento_isr, salario_neto)
VALUES
(1, 2, 'BOL-ADM-0001', 15.00, 0.00, 450.00, 13.50, 32.63, 25.62, 378.25);

-- Planilla de Campo Semanal de ejemplo (EMP-003: 6 días x $25 = $150 | EMP-004: 14 m2 destajo x $12.50 = $175)
INSERT INTO planillas (codigo_planilla, tipo_planilla, periodo_inicio, periodo_fin, fecha_pago, estado, total_devengado, total_deducciones, total_neto)
VALUES
('PLA-CAM-2026-01', 'CAMPO_SEMANAL', '2026-11-09', '2026-11-14', '2026-11-14', 'PAGADA', 325.00, 0.00, 325.00);

INSERT INTO detalle_planilla (planilla_id, empleado_id, numero_boleta, dias_trabajados, unidades_destajo, salario_devengado, descuento_isss, descuento_afp, descuento_isr, salario_neto)
VALUES
(2, 3, 'BOL-CAM-0001', 6.00, 0.00, 150.00, 0.00, 0.00, 0.00, 150.00),
(2, 4, 'BOL-CAM-0002', 0.00, 14.00, 175.00, 0.00, 0.00, 0.00, 175.00);


-- ============================================================================
-- 4. SEGURIDAD: USUARIOS PARA LOGIN JWT
-- Contraseña de todos los usuarios de prueba: Admin123*
-- (hash bcrypt verificado; cambiar estas credenciales en cualquier despliegue real)
-- ============================================================================

INSERT INTO usuarios (empleado_id, nombre_completo, username, correo, password_hash, rol_id, activo)
VALUES
(NULL, 'Administrador General', 'admin', 'admin@constructora.sv', '$2b$10$Is7iQqAzABmQpkPSRajepujfoxxl7Xo2MovemOgzlJ6OGSYfiZs8O', 1, TRUE),
(1, 'Andrea Sofía Vásquez Gómez', 'avasquez', 'andrea.vasquez@constructora.sv', '$2b$10$Is7iQqAzABmQpkPSRajepujfoxxl7Xo2MovemOgzlJ6OGSYfiZs8O', 3, TRUE),
(2, 'Roberto Carlos Martínez Pineda', 'rmartinez', 'roberto.martinez@constructora.sv', '$2b$10$Is7iQqAzABmQpkPSRajepujfoxxl7Xo2MovemOgzlJ6OGSYfiZs8O', 6, TRUE);


-- ============================================================================
-- 5. MÓDULO 3: PARTIDAS DE OBRA, RECETAS Y REPORTE DE AVANCE
-- ============================================================================

INSERT INTO partidas_obra (proyecto_id, fase, codigo_partida, nombre, porcentaje_avance)
VALUES
(2, 'OBRA_GRIS', 'PART-201', 'Fundición de Losa Nivel 1', 0.00),
(2, 'OBRA_GRIS', 'PART-202', 'Levantamiento de Paredes Bloque Nivel 1', 0.00);

-- Receta al 100% para PART-201
INSERT INTO receta_partida_materiales (partida_id, material_id, cantidad_total_requerida)
VALUES
(1, 1, 200.00), -- 200 bolsas de cemento
(1, 2, 40.00),  -- 40 quintales de hierro
(1, 3, 30.00);  -- 30 m3 de arena

-- Receta al 100% para PART-202
INSERT INTO receta_partida_materiales (partida_id, material_id, cantidad_total_requerida)
VALUES
(2, 1, 80.00),   -- 80 bolsas de cemento
(2, 4, 2000.00); -- 2000 bloques de concreto

-- Reporte de avance del 25% en PART-201 por la Ing. Andrea Vásquez (ID 1)
-- El trigger trg_procesar_avance_obra descuenta automáticamente 50 bolsas cemento, 10 qq hierro y 7.5 m3 arena
-- de la Bodega Obra Torre Escalón (ID 3), registra Kardex y acumula el costo ($1,191.25).
INSERT INTO reportes_avance (partida_id, ingeniero_id, porcentaje_anterior, porcentaje_nuevo, observaciones)
VALUES
(1, 1, 0.00, 25.00, 'Completada primera etapa de armado y fundición de losa sector norte.');


-- ============================================================================
-- 6. MÓDULO 5: UNIDADES INMOBILIARIAS, CRM, VENTA Y FACTURACIÓN
-- ============================================================================

INSERT INTO unidades_inmobiliarias (proyecto_id, codigo_unidad, tipo_unidad, area_m2, habitaciones, precio_venta, estado)
VALUES
(2, 'APTO-101', 'APARTAMENTO', 95.50, 2, 145000.00, 'DISPONIBLE'),
(2, 'APTO-102', 'APARTAMENTO', 115.00, 3, 178000.00, 'DISPONIBLE'),
(1, 'CASA-L01', 'CASA', 140.00, 3, 195000.00, 'DISPONIBLE');

INSERT INTO clientes_crm (nombres, apellidos, dui, nit, nrc, giro_economico, telefono, correo, estado_embudo, proyecto_interes_id, asesor_id, notas_seguimiento)
VALUES
('Mario Ernesto', 'Solórzano', '02345678-9', '0614-150490-102-3', '245890-1', 'Servicios de Consultoría Empresarial', '7845-1234', 'msolorzano@correo.com', 'COTIZADO', 2, 2, 'Solicita factura CCF para inversión corporativa.'),
('Laura Beatriz', 'Mendoza Rivas', '05678912-3', '0614-220895-104-1', NULL, NULL, '7123-9876', 'laura.mendoza@correo.com', 'VISITA_AGENDADA', 2, 2, 'Interesada en APTO-102, visita agendada para el sábado.');

-- Venta de APTO-101 al cliente Mario Solórzano
-- El trigger trg_procesar_venta cambia APTO-101 a VENDIDA, cierra al cliente en CRM
-- y genera automáticamente la Cuota 0 (Prima $29,000) + 12 cuotas mensuales.
INSERT INTO ventas_inmobiliarias (numero_contrato, unidad_id, cliente_id, asesor_id, fecha_venta, precio_acordado, monto_prima, monto_financiar, tasa_interes_anual, plazo_meses)
VALUES
('CONT-2026-001', 1, 1, 2, '2026-11-15', 145000.00, 29000.00, 116000.00, 7.50, 12);

-- Pago de la Prima (Cuota ID 1 = Cuota 0) emitiendo CCF
-- El trigger trg_preparar_factura_abono valida el NRC del cliente y asigna correlativo 'CCF-00000001'
-- El trigger trg_aplicar_pago_cuota marca la cuota de prima como PAGADA
INSERT INTO facturas_abonos (cuota_id, venta_id, cliente_id, tipo_documento, numero_correlativo, concepto, subtotal_gravado, subtotal_exento, iva_13, total_pagado, metodo_pago)
VALUES
(1, 1, 1, 'CCF', NULL, 'Pago de prima (20%) correspondiente a contrato CONT-2026-001 - APTO-101', 25663.72, 0.00, 3336.28, 29000.00, 'TRANSFERENCIA');