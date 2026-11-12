import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Card, CardBody } from 'reactstrap';
import { crearAvance } from '../../api/obraApi';
function AvanceForm() {
 const [formData, setFormData] = useState({ proyectoId: '', partida: '', porcentaje: '', fecha: '' });
 const navigate = useNavigate();
 function handleChange(e) {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 }
 async function handleSubmit(e) {
 e.preventDefault();
 await crearAvance(formData);
 navigate('/obra/avances');
 }
 return (
 <Card>
 <CardBody>
 <h4 className="text-brand mb-3">Registrar Avance de Obra</h4>
 <Form onSubmit={handleSubmit}>
 <FormGroup>
 <Label>ID Proyecto</Label>
 <Input name="proyectoId" value={formData.proyectoId} onChange={handleChange} required />
 </FormGroup>
 <FormGroup>
 <Label>Partida</Label>
 <Input name="partida" value={formData.partida} onChange={handleChange} required />
 </FormGroup>
 <FormGroup>
 <Label>Porcentaje de avance</Label>
 <Input type="number" name="porcentaje" min="0" max="100" value={formData.porcentaje} onChange={handleChange} required />
 </FormGroup>
 <FormGroup>
 <Label>Fecha</Label>
 <Input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required />
 </FormGroup>
 <Button color="success" type="submit">Guardar Avance</Button>
 </Form>
 </CardBody>
 </Card>
 );
}
export default AvanceForm;