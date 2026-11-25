import React, { useEffect, useState } from 'react';
import {
  getPlanillas,
  previewPlanilla,
  createPlanilla,
  changePlanillaStatus,
  deletePlanilla,
} from '../../api/rrhhApi';
import { Screen, Panel, Notice, Table, Field, money, date } from '../../components/ui/Screen';

const initial = () => ({
  tipo_planilla: 'ADMINISTRATIVA_QUINCENAL',
  periodo_inicio: '',
  periodo_fin: '',
  fecha_pago: '',
});

export default function PlanillaAdmin() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    getPlanillas({ tipo: 'ADMINISTRATIVA_QUINCENAL' }).then(setRows).catch(setError);

  useEffect(() => {
    load();
  }, []);

  const body = () => ({ ...form, detalles: [] });

  async function calculate(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setPreview(await previewPlanilla(body()));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      await createPlanilla(body());
      setPreview(null);
      setForm(initial());
      load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function advance(r) {
    const estado =
      r.estado === 'BORRADOR' ? 'APROBADA' : r.estado === 'APROBADA' ? 'PAGADA' : null;
    if (!estado) return;
    try {
      await changePlanillaStatus(r.id, estado);
      load();
    } catch (err) {
      setError(err);
    }
  }

  async function remove(r) {
    if (!window.confirm('¿Eliminar esta planilla borrador?')) return;
    try {
      await deletePlanilla(r.id);
      load();
    } catch (err) {
      setError(err);
    }
  }

  const previewColumns = [
    { key: 'empleado', label: 'Empleado' },
    { key: 'salario_devengado', label: 'Devengado', render: (r) => money(r.salario_devengado) },
    { key: 'descuento_isss', label: 'ISSS', render: (r) => money(r.descuento_isss) },
    { key: 'descuento_afp', label: 'AFP', render: (r) => money(r.descuento_afp) },
    { key: 'descuento_isr', label: 'ISR', render: (r) => money(r.descuento_isr) },
    { key: 'salario_neto', label: 'Neto', render: (r) => money(r.salario_neto) },
  ];

  const historyColumns = [
    { key: 'codigo_planilla', label: 'Código' },
    { key: 'periodo_inicio', label: 'Desde', render: (r) => date(r.periodo_inicio) },
    { key: 'periodo_fin', label: 'Hasta', render: (r) => date(r.periodo_fin) },
    { key: 'fecha_pago', label: 'Pago', render: (r) => date(r.fecha_pago) },
    { key: 'estado', label: 'Estado' },
    { key: 'total_neto', label: 'Neto', render: (r) => money(r.total_neto) },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (r) => (
        <div className="inline-actions">
          {r.estado !== 'PAGADA' && (
            <button className="btn btn-sm btn-outline-primary" onClick={() => advance(r)}>
              {r.estado === 'BORRADOR' ? 'Aprobar' : 'Marcar pagada'}
            </button>
          )}
          {r.estado === 'BORRADOR' && (
            <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r)}>
              Eliminar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Screen
      title="Planilla administrativa"
      subtitle="Cálculo quincenal de salarios, ISSS, AFP e ISR."
    >
      <Notice error={error} />

      <Panel title="Generar planilla">
        <form className="form-grid compact" onSubmit={calculate}>
          <Field label="Inicio del período">
            <input
              required
              type="date"
              value={form.periodo_inicio}
              onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
            />
          </Field>

          <Field label="Fin del período">
            <input
              required
              type="date"
              value={form.periodo_fin}
              onChange={(e) => setForm({ ...form, periodo_fin: e.target.value })}
            />
          </Field>

          <Field label="Fecha de pago">
            <input
              type="date"
              value={form.fecha_pago}
              onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
            />
          </Field>

          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              Calcular vista previa
            </button>
          </div>
        </form>

        {preview && (
          <div className="preview-box">
            <h3>Vista previa · {preview.codigo_planilla || 'Planilla calculada'}</h3>

            <div className="stats-grid small-stats">
              <div>
                <span>Devengado</span>
                <b>{money(preview.total_devengado)}</b>
              </div>
              <div>
                <span>Deducciones</span>
                <b>{money(preview.total_deducciones)}</b>
              </div>
              <div>
                <span>Neto a pagar</span>
                <b>{money(preview.total_neto)}</b>
              </div>
            </div>

            <Table rows={preview.detalles || []} columns={previewColumns} />

            <button className="btn btn-success" onClick={save} disabled={busy}>
              Guardar planilla
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Historial de planillas">
        <Table rows={rows} columns={historyColumns} />
      </Panel>
    </Screen>
  );
}
