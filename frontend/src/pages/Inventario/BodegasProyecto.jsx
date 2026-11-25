import React, { useState } from 'react';
import { Table, Spinner, Input, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getBodegas, getStockDeBodega } from '../../api/inventarioApi';

function BodegasProyecto() {
  const { data: bodegas, loading: loadingBodegas } = useFetch(() => getBodegas('PROYECTO'), []);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState('');

  const { data: stock, loading: loadingStock } = useFetch(
    () => (bodegaSeleccionada ? getStockDeBodega(bodegaSeleccionada) : Promise.resolve([])),
    [bodegaSeleccionada]
  );

  if (loadingBodegas) return <Spinner color="primary" />;

  return (
    <div>
      <h3 className="text-brand mb-3">Bodegas de Proyecto</h3>
      <Input
        type="select"
        className="mb-3"
        value={bodegaSeleccionada}
        onChange={(e) => setBodegaSeleccionada(e.target.value)}
      >
        <option value="">Selecciona una bodega...</option>
        {bodegas && bodegas.map((b) => (
          <option key={b.id} value={b.id}>{b.nombre} — {b.proyecto}</option>
        ))}
      </Input>

      {loadingStock ? (
        <Spinner color="primary" />
      ) : bodegaSeleccionada ? (
        <Table hover responsive>
          <thead>
            <tr><th>Código</th><th>Material</th><th>Unidad</th><th>Stock Actual</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {stock && stock.length > 0 ? stock.map((s) => (
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
            )) : (
              <tr><td colSpan="5" className="text-center text-muted">Sin materiales en esta bodega.</td></tr>
            )}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">Selecciona una bodega para ver su stock.</p>
      )}
    </div>
  );
}

export default BodegasProyecto;