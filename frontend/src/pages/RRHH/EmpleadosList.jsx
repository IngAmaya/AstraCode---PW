import React, { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado } from '../../api/rrhhApi';
import { Screen, Panel, Notice, Loading, Table, Field } from '../../components/ui/Screen';

const empty = {
  nombres: '',
  apellidos: '',
  dui: '',
  cargo: '',
  tipo_empleado: 'ADMINISTRATIVO',
  salario_mensual: '',
  modalidad_pago_campo: 'POR_DIA',
  tarifa_campo: '',
  es_ingeniero: false,
};

export default function EmpleadosList() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getEmpleados().then(setRows).catch(setError);

  useEffect(() => {
    load();
  }, []);

  const setField = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const body = {
      ...form,
      salario_mensual: Number(form.salario_mensual || 0),
      tarifa_campo: Number(form.tarifa_campo || 0),
      es_ingeniero: Boolean(form.es_ingeniero),
    };

    try {
      if (edit) await updateEmpleado(edit, body);
      else await createEmpleado(body);
      setForm(empty);
      setEdit(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(r) {
    setEdit(r.id);
    setForm({
      ...empty,
      ...r,
      salario_mensual: r.salario_mensual ?? '',
      tarifa_campo: r.tarifa_campo ?? '',
    });
  }

  function cancelEdit() {
    setEdit(null);
    setForm(empty);
  }

  async function deactivate(id) {
    if (!window.confirm('¿Desactivar este empleado?')) return;
    try {
      await deleteEmpleado(id);
      load();
    } catch (err) {
      setError(err);
    }
  }

  const columns = [
    { key: 'codigo_empleado', label: 'Código' },
    { key: 'nombres', label: 'Nombre', render: (r) => `${r.nombres} ${r.apellidos}` },
    { key: 'dui', label: 'DUI' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'tipo_empleado', label: 'Tipo' },
    { key: 'activo', label: 'Estado', render: (r) => (r.activo ? 'Activo' : 'Inactivo') },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (r) => (
        <div className="inline-actions">
          <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(r)}>
            Editar
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => deactivate(r.id)}>
            Desactivar
          </button>
        </div>
      ),
    },
  ];

  const esAdministrativo = form.tipo_empleado === 'ADMINISTRATIVO';

  return (
    <Screen title="Gestión de empleados" subtitle="Personal administrativo y de campo.">
      <Notice error={error} />

      <Panel title={edit ? 'Editar empleado' : 'Nuevo empleado'}>
        <form className="form-grid" onSubmit={submit}>
          <Field label="Nombres">
            <input required value={form.nombres} onChange={setField('nombres')} />
          </Field>

          <Field label="Apellidos">
            <input required value={form.apellidos} onChange={setField('apellidos')} />
          </Field>

          <Field label="DUI">
            <input
              required
              placeholder="12345678-9"
              value={form.dui}
              onChange={setField('dui')}
            />
          </Field>

          <Field label="Cargo">
            <input required value={form.cargo} onChange={setField('cargo')} />
          </Field>

          <Field label="Tipo">
            <select value={form.tipo_empleado} onChange={setField('tipo_empleado')}>
              <option>ADMINISTRATIVO</option>
              <option>CAMPO</option>
            </select>
          </Field>

          {esAdministrativo ? (
            <Field label="Salario mensual ($)">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.salario_mensual}
                onChange={setField('salario_mensual')}
              />
            </Field>
          ) : (
            <>
              <Field label="Modalidad de pago">
                <select
                  value={form.modalidad_pago_campo}
                  onChange={setField('modalidad_pago_campo')}
                >
                  <option value="POR_DIA">Por día</option>
                  <option value="DESTAJO">Destajo</option>
                </select>
              </Field>

              <Field label="Tarifa ($)">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.tarifa_campo}
                  onChange={setField('tarifa_campo')}
                />
              </Field>
            </>
          )}

          <label className="check-field">
            <input
              type="checkbox"
              checked={!!form.es_ingeniero}
              onChange={(e) => setForm({ ...form, es_ingeniero: e.target.checked })}
            />{' '}
            Puede reportar avances como ingeniero
          </label>

          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Guardando…' : edit ? 'Actualizar' : 'Crear empleado'}
            </button>
            {edit && (
              <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Panel>

      <Panel title="Personal registrado">
        <Loading busy={false} />
        <Table rows={rows} columns={columns} />
      </Panel>
    </Screen>
  );
}
