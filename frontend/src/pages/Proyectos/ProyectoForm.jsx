import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Card, CardBody } from 'reactstrap';
import { createProyecto } from '../../api/proyectosApi';
import { ESTADOS_PROYECTO } from '../../utils/constants';

function ProyectoForm() {
  const [formData, setFormData] = useState({ nombreProyecto: '', estado: ESTADOS_PROYECTO[0], fechaInicio: '' });
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await createProyecto(formData);
    navigate('/proyectos');
  }

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-3">Nuevo Proyecto</h4>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Nombre del Proyecto</Label>
            <Input name="nombreProyecto" value={formData.nombreProyecto} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Estado</Label>
            <Input type="select" name="estado" value={formData.estado} onChange={handleChange}>
              {ESTADOS_PROYECTO.map((estado) => <option key={estado}>{estado}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Fecha de Inicio</Label>
            <Input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} required />
          </FormGroup>
          <Button color="success" type="submit">Guardar Proyecto</Button>
        </Form>
      </CardBody>
    </Card>
  );
}

export default ProyectoForm;