import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Alert } from 'reactstrap';
import { crearProyecto } from '../../api/proyectosApi';
import { TIPOS_PROYECTO } from '../../utils/constants';

function ProyectoForm() {
  const [formData, setFormData] = useState({
    nombre: '', tipo_proyecto: TIPOS_PROYECTO[0], ubicacion: '', presupuesto_total: '', fecha_inicio_estimada: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await crearProyecto({ ...formData, presupuesto_total: Number(formData.presupuesto_total) });
      navigate('/proyectos');
    } catch (err) {
      setError('No se pudo crear el proyecto. Verifica los datos.');
    }
  }

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-3">Nuevo Proyecto</h4>
        {error && <Alert color="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Nombre del Proyecto</Label>
            <Input name="nombre" value={formData.nombre} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Tipo de Proyecto</Label>
            <Input type="select" name="tipo_proyecto" value={formData.tipo_proyecto} onChange={handleChange}>
              {TIPOS_PROYECTO.map((t) => (
                <option key={t} value={t}>{t === 'CASAS_SERIE' ? 'Casas en serie' : 'Apartamentos'}</option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Ubicación</Label>
            <Input name="ubicacion" value={formData.ubicacion} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Presupuesto Total</Label>
            <Input type="number" name="presupuesto_total" value={formData.presupuesto_total} onChange={handleChange} min="0" required />
          </FormGroup>
          <FormGroup>
            <Label>Fecha de Inicio Estimada</Label>
            <Input type="date" name="fecha_inicio_estimada" value={formData.fecha_inicio_estimada} onChange={handleChange} />
          </FormGroup>
          <Button color="success" type="submit">Guardar Proyecto</Button>
        </Form>
      </CardBody>
    </Card>
  );
}

export default ProyectoForm;