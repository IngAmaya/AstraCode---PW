import React from 'react';
import { Table, Spinner } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getPartidas } from '../../api/obraApi';
import { formatCurrency } from '../../utils/formatters';
function PartidasObra() {
 const { data: partidas, loading } = useFetch(getPartidas, []);
 if (loading) return <Spinner color="primary" />;
 return (
 <div>
 <h3 className="text-brand mb-3">Partidas de Obra</h3>
 <Table hover responsive>
 <thead>
 <tr><th>Partida</th><th>Costo unitario</th></tr>
 </thead>
 <tbody>
 {partidas && partidas.map((p) => (
 <tr key={p.id}>
 <td>{p.nombre}</td>
 <td>{formatCurrency(p.costoUnitario)}</td>
 </tr>
 ))}
 </tbody>
 </Table>
 </div>
 );
}
export default PartidasObra;