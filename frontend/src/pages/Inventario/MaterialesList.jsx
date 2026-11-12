import React from 'react';
import { Table, Spinner } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getMateriales } from '../../api/inventarioApi';

function MaterialesList() {
  const { data: materiales, loading } = useFetch(getMateriales, []);

  if (loading) return <Spinner color="primary" />;

  return (
    <div>
      <h3 className="text-brand mb-3">Materiales — Bodega Central</h3>
      <Table hover responsive>
        <thead>
          <tr><th>Material</th><th>Unidad</th><th>Cantidad disponible</th></tr>
        </thead>
        <tbody>
          {materiales && materiales.map((m) => (
            <tr key={m.id}>
              <td>{m.nombre}</td>
              <td>{m.unidad}</td>
              <td>{m.cantidadBodegaCentral}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default MaterialesList;