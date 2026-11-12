import React from 'react';
import { Table, Spinner } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getBodegasProyecto } from '../../api/inventarioApi';

function BodegasProyecto() {
  const { data: bodegas, loading } = useFetch(getBodegasProyecto, []);

  if (loading) return <Spinner color="primary" />;

  return (
    <div>
      <h3 className="text-brand mb-3">Bodegas por Proyecto</h3>
      <Table hover responsive>
        <thead>
          <tr><th>Proyecto ID</th><th>Material ID</th><th>Cantidad</th></tr>
        </thead>
        <tbody>
          {bodegas && bodegas.map((b) => (
            <tr key={b.id}>
              <td>{b.proyectoId}</td>
              <td>{b.materialId}</td>
              <td>{b.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default BodegasProyecto;