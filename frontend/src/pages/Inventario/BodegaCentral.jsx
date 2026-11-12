import React from 'react';
import { Card, CardBody, Spinner } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getMateriales } from '../../api/inventarioApi';

function BodegaCentral() {
  const { data: materiales, loading } = useFetch(getMateriales, []);

  if (loading) return <Spinner color="primary" />;

  const total = materiales ? materiales.reduce((sum, m) => sum + m.cantidadBodegaCentral, 0) : 0;

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand">Resumen Bodega Central</h4>
        <p>Total de materiales distintos: {materiales ? materiales.length : 0}</p>
        <p>Unidades totales en bodega: {total}</p>
      </CardBody>
    </Card>
  );
}

export default BodegaCentral;