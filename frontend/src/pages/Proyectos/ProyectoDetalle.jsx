import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, Spinner, Button, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getProyectoById } from '../../api/proyectosApi';
import { formatDate } from '../../utils/formatters';

function ProyectoDetalle() {
  const { id } = useParams();
  const { data: proyecto, loading } = useFetch(() => getProyectoById(id), [id]);

  if (loading) return <Spinner color="primary" />;
  if (!proyecto) return <p>Proyecto no encontrado.</p>;

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand">{proyecto.nombreProyecto}</h4>
        <p><Badge color="info">{proyecto.estado}</Badge></p>
        <p>Fecha de inicio: {formatDate(proyecto.fechaInicio)}</p>
        <Button tag={Link} to={`/proyectos/${id}/permisos`} color="warning">
          Gestionar Permisos
        </Button>
      </CardBody>
    </Card>
  );
}

export default ProyectoDetalle;