import React, { useState } from 'react';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Alert } from 'reactstrap';
import { crearTraslado } from '../../api/inventarioApi';

function TrasladosForm() {
  const [formData, setFormData] = useState({ proyectoId: '', materialId: '', cantidad: '' });
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await crearTraslado(formData);
    setSuccess(true);
    setFormData({ proyectoId: '', materialId: '', cantidad: '' });
  }

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-3">Nuevo Traslado a Proyecto</h4>
        {success && <Alert color="success">Traslado registrado correctamente.</Alert>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>ID Proyecto</Label>
            <Input name="proyectoId" value={formData.proyectoId} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>ID Material</Label>
            <Input name="materialId" value={formData.materialId} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Cantidad</Label>
            <Input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} required />
          </FormGroup>
          <Button color="success" type="submit">Registrar Traslado</Button>
        </Form>
      </CardBody>
    </Card>
  );
}

export default TrasladosForm;