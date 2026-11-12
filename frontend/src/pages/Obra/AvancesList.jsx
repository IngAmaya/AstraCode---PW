import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Progress } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getAvances } from '../../api/obraApi';
import { formatDate } from '../../utils/formatters';
function AvancesList() {
 const { data: avances, loading } = useFetch(getAvances, []);
 if (loading) return <Spinner color="primary" />;
 return (
 <div>
 <div className="d-flex justify-content-between align-items-center mb-3">
 <h3 className="text-brand">Avances de Obra</h3>
 <Button tag={Link} to="/obra/avances/nuevo" color="success">+ Registrar Avance</Button>
 </div>
 <Table hover responsive>
 <thead>
 <tr><th>Proyecto</th><th>Partida</th><th>Avance</th><th>Fecha</th></tr>
 </thead>
 <tbody>
 {avances && avances.map((a) => (
 <tr key={a.id}>
 <td>{a.proyectoId}</td>
 <td>{a.partida}</td>
 <td><Progress value={a.porcentaje}>{a.porcentaje}%</Progress></td>
 <td>{formatDate(a.fecha)}</td>
 </tr>
 ))}
 </tbody>
 </Table>
 </div>
 );
}
export default AvancesList;