import React, { useEffect, useState } from 'react';
import { getFacturas } from '../../api/ventasApi';
import { Screen, Panel, Notice, Table, Field, money, date } from '../../components/ui/Screen';

export default function FacturacionCCF() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ tipo: '', desde: '', hasta: '' });

  const load = () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v)
    );
    return getFacturas(params).then(setRows).catch(setError);
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { key: 'numero_correlativo', label: 'Documento' },
    { key: 'tipo_documento', label: 'Tipo' },
    { key: 'fecha_emision', label: 'Fecha', render: (r) => date(r.fecha_emision) },
    { key: 'cliente', label: 'Cliente' },
    { key: 'concepto', label: 'Concepto' },
    { key: 'subtotal_gravado', label: 'Gravado', render: (r) => money(r.subtotal_gravado) },
    { key: 'iva_13', label: 'IVA', render: (r) => money(r.iva_13) },
    { key: 'total_pagado', label: 'Total', render: (r) => money(r.total_pagado) },
  ];

  return (
    <Screen
      title="Facturación"
      subtitle="Documentos fiscales generados a partir de los abonos."
    >
      <Notice error={error} />

      <Panel title="Documentos emitidos">
        <form
          className="search-row"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <Field label="Tipo">
            <select
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="RECIBO">Recibo</option>
              <option value="FACTURA_CONSUMIDOR_FINAL">Factura consumidor final</option>
              <option value="CCF">CCF</option>
            </select>
          </Field>

          <Field label="Desde">
            <input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
            />
          </Field>

          <Field label="Hasta">
            <input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
            />
          </Field>

          <button className="btn btn-outline-primary">Filtrar</button>
        </form>

        <Table rows={rows} columns={columns} />
      </Panel>
    </Screen>
  );
}
