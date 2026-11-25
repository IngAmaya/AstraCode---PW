import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPlanesCliente, createAbono } from '../../api/ventasApi';
import {
  Screen,
  Panel,
  Notice,
  Field,
  money,
} from '../../components/ui/Screen';

const METODOS_PAGO = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'CHEQUE',
  'FINANCIAMIENTO_BANCARIO',
];

export default function AbonosForm() {
  const { clienteId } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    cuota_id: params.get('cuota') || '',
    tipo_documento: 'FACTURA_CONSUMIDOR_FINAL',
    metodo_pago: 'EFECTIVO',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPlanesCliente(clienteId).then(setData).catch(setError);
  }, [clienteId]);

  const cuotas =
    data?.contratos
      ?.flatMap((c) =>
        c.cuotas.map((q) => ({
          ...q,
          contrato: c.venta.numero_contrato || c.venta.id,
        }))
      )
      .filter((q) => q.estado !== 'PAGADA') || [];

  const cuota = cuotas.find((q) => String(q.id) === String(form.cuota_id));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await createAbono(clienteId, {
        ...form,
        cuota_id: Number(form.cuota_id),
      });
      nav(`/ventas/plan-pagos/${clienteId}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Registrar abono"
      subtitle="El abono debe corresponder al monto exacto de la cuota seleccionada."
    >
      <Notice error={error} />

      <Panel title="Datos del pago">
        <form className="form-grid" onSubmit={submit}>
          <Field label="Cuota pendiente">
            <select
              required
              value={form.cuota_id}
              onChange={(e) => setForm({ ...form, cuota_id: e.target.value })}
            >
              <option value="">Seleccione cuota</option>
              {cuotas.map((q) => (
                <option key={q.id} value={q.id}>
                  Contrato {q.contrato} ·{' '}
                  {q.numero_cuota === 0 ? 'Prima' : `Cuota ${q.numero_cuota}`} ·{' '}
                  {money(q.monto_total_cuota)} · {q.estado}
                </option>
              ))}
            </select>
          </Field>

          {cuota && (
            <div className="payment-total">
              <span>Total exacto a pagar</span>
              <strong>{money(cuota.monto_total_cuota)}</strong>
            </div>
          )}

          <Field label="Documento fiscal">
            <select
              value={form.tipo_documento}
              onChange={(e) =>
                setForm({ ...form, tipo_documento: e.target.value })
              }
            >
              <option value="RECIBO">Recibo</option>
              <option value="FACTURA_CONSUMIDOR_FINAL">
                Factura consumidor final
              </option>
              <option value="CCF">Comprobante de crédito fiscal (CCF)</option>
            </select>
          </Field>

          <Field label="Método de pago">
            <select
              value={form.metodo_pago}
              onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
            >
              {METODOS_PAGO.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              disabled={busy || !cuotas.length}
            >
              {busy ? 'Registrando…' : 'Registrar abono y emitir documento'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => nav(-1)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Panel>
    </Screen>
  );
}