-- ============================================================================
-- MIGRACIÓN: prima de $0 en el plan de pagos
-- Solo hace falta en una BD que ya tiene el schema anterior. Una BD nueva creada con
-- schema.sql ya lo trae.
--   psql -U postgres -d constructora_erp_sv -f migracion_prima_cero.sql
-- Efecto: las ventas NUEVAS con prima $0 ya no crean la cuota 0. Las ventas existentes no cambian.
-- ============================================================================

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
