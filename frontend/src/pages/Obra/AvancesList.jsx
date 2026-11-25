import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvances } from '../../api/obraApi';
import {
  Screen,
  Panel,
  Notice,
  Loading,
  Table,
  date,
  money,
} from '../../components/ui/Screen';

export default function AvancesList() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setBusy(true);
    getAvances()
      .then(setRows)
      .catch(setError)
      .finally(() => setBusy(false));
  };

  useEffect(load, []);

  const columns = [
    {
      key: 'fecha_reporte',
      label: 'Fecha',
      render: (r) => date(r.fecha_reporte),
    },
    { key: 'codigo_partida', label: 'Partida' },
    { key: 'partida', label: 'Descripción' },
    { key: 'ingeniero', label: 'Ingeniero' },
    {
      key: 'porcentaje_anterior',
      label: 'Anterior',
      render: (r) => `${r.porcentaje_anterior}%`,
    },
    {
      key: 'porcentaje_nuevo',
      label: 'Nuevo',
      render: (r) => <b>{r.porcentaje_nuevo}%</b>,
    },
    {
      key: 'costo_calculado_avance',
      label: 'Costo',
      render: (r) => money(r.costo_calculado_avance),
    },
  ];

  return (
    <Screen
      title="Avances de obra"
      subtitle="Reportes de progreso registrados por partida."
      actions={
        <Link className="btn btn-primary" to="/obra/avances/nuevo">
          + Registrar avance
        </Link>
      }
    >
      <Notice error={error} />

      <Panel title="Historial">
        <Loading busy={busy} />
        <Table rows={rows} columns={columns} />
      </Panel>
    </Screen>
  );
}