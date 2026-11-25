import React from 'react';
import { Table, Spinner, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getMateriales } from '../../api/inventarioApi';
import { formatCurrency } from '../../utils/formatters';

function MaterialesList() {
  const { data: materiales, loading } = useFetch(getMateriales, []);

  if (loading) return <Spinner color="primary" />;

  return (
    <div>
      <h3 className="text-brand mb-3">Materiales</h3>
      <Table hover responsive>
        <thead>
          <tr>
            <th>Código</th><th>Nombre</th><th>Unidad</th><th>Costo Unitario</th>
            <th>Stock Central</th><th>Stock Total</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {materiales && materiales.map((m) => {
            const bajoMinimo = Number(m.stock_total) <= Number(m.stock_minimo);
            return (
              <tr key={m.id}>
                <td>{m.codigo}</td>
                <td>{m.nombre}</td>
                <td>{m.unidad_medida}</td>
                <td>{formatCurrency(m.costo_unitario)}</td>
                <td>{m.stock_central}</td>
                <td>{m.stock_total}</td>
                <td>
                  {bajoMinimo
                    ? <Badge color="danger">Stock bajo (mín. {m.stock_minimo})</Badge>
                    : <Badge color="success">OK</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default MaterialesList;