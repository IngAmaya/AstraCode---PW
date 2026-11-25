import React from 'react';
import { Card, CardBody, Table, Spinner, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getBodegas, getStockDeBodega } from '../../api/inventarioApi';

function BodegaCentral() {
  const { data: bodegas, loading: loadingBodegas } = useFetch(() => getBodegas('CENTRAL'), []);
  const bodegaCentral = bodegas && bodegas[0];

  const { data: stock, loading: loadingStock } = useFetch(
    () => (bodegaCentral ? getStockDeBodega(bodegaCentral.id) : Promise.resolve([])),
    [bodegaCentral?.id]
  );

  if (loadingBodegas || loadingStock) return <Spinner color="primary" />;
  if (!bodegaCentral) return <p>No se encontró una bodega central.</p>;

  return (
    <div>
      <Card className="mb-3">
        <CardBody>
          <h4 className="text-brand">{bodegaCentral.nombre}</h4>
          <p>Ubicación: {bodegaCentral.ubicacion}</p>
        </CardBody>
      </Card>

      <h5 className="mb-3">Stock disponible</h5>
      <Table hover responsive>
        <thead>
          <tr><th>Código</th><th>Material</th><th>Unidad</th><th>Stock Actual</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {stock && stock.map((s) => (
            <tr key={s.id}>
              <td>{s.codigo}</td>
              <td>{s.nombre}</td>
              <td>{s.unidad_medida}</td>
              <td>{s.stock_actual}</td>
              <td>
                {s.bajo_minimo
                  ? <Badge color="danger">Bajo mínimo ({s.stock_minimo})</Badge>
                  : <Badge color="success">OK</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default BodegaCentral;