import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getProyectos } from '../../api/proyectosApi';
import { formatCurrency, formatDate, formatEstado } from '../../utils/formatters';

function ProyectosList() {
  const { data: proyectos, loading, error } = useFetch(getProyectos, []);

  if (loading) return <Spinner color="primary" />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-brand">Proyectos</h3>
        <Button tag={Link} to="/proyectos/nuevo" color="success">+ Nuevo Proyecto</Button>
      </div>
      <Table hover responsive>
        <thead>
          <tr>
            <th>Código</th><th>Nombre</th><th>Tipo</th><th>Fase</th><th>Estado</th>
            <th>Presupuesto</th><th>Permisos</th><th></th>
          </tr>
        </thead>
        <tbody>
          {proyectos && proyectos.map((p) => (
            <tr key={p.id}>
              <td>{p.codigo}</td>
              <td>{p.nombre}</td>
              <td>{p.tipo_proyecto === 'CASAS_SERIE' ? 'Casas en serie' : 'Apartamentos'}</td>
              <td><Badge color="info">{formatEstado(p.fase_actual)}</Badge></td>
              <td><Badge color="secondary">{formatEstado(p.estado)}</Badge></td>
              <td>{formatCurrency(p.presupuesto_total)}</td>
              <td>
                {p.puede_iniciar_obra
                  ? <Badge color="success">Completos</Badge>
                  : <Badge color="warning">Pendientes</Badge>}
              </td>
              <td>
                <Button tag={Link} to={`/proyectos/${p.id}`} size="sm" color="primary">Ver</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ProyectosList;