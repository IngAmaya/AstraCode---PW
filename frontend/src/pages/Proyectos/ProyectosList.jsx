import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getProyectos } from '../../api/proyectosApi';
import { formatDate } from '../../utils/formatters';

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
            <th>Nombre</th>
            <th>Estado</th>
            <th>Fecha Inicio</th>
            <th>Permisos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {proyectos && proyectos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombreProyecto}</td>
              <td><Badge color="info">{p.estado}</Badge></td>
              <td>{formatDate(p.fechaInicio)}</td>
              <td>
                {p.permisos.opamss && p.permisos.marn && p.permisos.anda
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