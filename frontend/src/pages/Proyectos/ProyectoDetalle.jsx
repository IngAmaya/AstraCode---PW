import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, Spinner, Button, Badge, Row, Col } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getProyectoById } from '../../api/proyectosApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

function ProyectoDetalle() {
  const { id } = useParams();
  const { data: proyecto, loading } = useFetch(() => getProyectoById(id), [id]);

  if (loading) return <Spinner color="primary" />;
  if (!proyecto) return <p>Proyecto no encontrado.</p>;

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand">{proyecto.codigo} — {proyecto.nombre}</h4>
        <Row className="mb-3">
          <Col md="3"><Badge color="info">{proyecto.fase_actual}</Badge></Col>
          <Col md="3"><Badge color="secondary">{proyecto.estado}</Badge></Col>
          <Col md="3">
            {proyecto.puede_iniciar_obra
              ? <Badge color="success">Permisos completos</Badge>
              : <Badge color="warning">Permisos pendientes</Badge>}
          </Col>
        </Row>
        <p><strong>Tipo:</strong> {proyecto.tipo_proyecto === 'CASAS_SERIE' ? 'Casas en serie' : 'Apartamentos'}</p>
        <p><strong>Ubicación:</strong> {proyecto.ubicacion}</p>
        <p><strong>Presupuesto:</strong> {formatCurrency(proyecto.presupuesto_total)}</p>
        <p><strong>Fecha de inicio estimada:</strong> {formatDate(proyecto.fecha_inicio_estimada)}</p>
        <Button tag={Link} to={`/proyectos/${id}/permisos`} color="warning">
          Gestionar Permisos
        </Button>
      </CardBody>
    </Card>
  );
}

export default ProyectoDetalle;