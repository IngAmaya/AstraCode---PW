import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { register } from '../../api/authApi';

function Register() {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError('No se pudo registrar el usuario.');
    }
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px' }}>
        <CardBody>
          <h4 className="text-brand mb-4">Crear Cuenta</h4>
          {error && <Alert color="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Nombre</Label>
              <Input name="nombre" value={formData.nombre} onChange={handleChange} required />
            </FormGroup>
            <FormGroup>
              <Label>Correo electrónico</Label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </FormGroup>
            <FormGroup>
              <Label>Contraseña</Label>
              <Input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </FormGroup>
            <Button color="primary" type="submit" block>Registrarse</Button>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Register;