import React, { useState } from 'react';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Alert } from 'reactstrap';
import { register } from '../../api/authApi';
import { ROLES } from '../../utils/constants';

function Register() {
  const [formData, setFormData] = useState({
    nombre_completo: '', username: '', correo: '', password: '', rol: ROLES.ADMIN, empleado_id: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const payload = { ...formData };
      if (!payload.empleado_id) delete payload.empleado_id;
      await register(payload);
      setSuccess(true);
      setFormData({ nombre_completo: '', username: '', correo: '', password: '', rol: ROLES.ADMIN, empleado_id: '' });
    } catch (err) {
      setError('No se pudo crear el usuario. Verifica los datos.');
    }
  }

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-4">Crear Nuevo Usuario</h4>
        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">Usuario creado correctamente.</Alert>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Nombre completo</Label>
            <Input name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Usuario (username)</Label>
            <Input name="username" value={formData.username} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Correo electrónico</Label>
            <Input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Contraseña (mínimo 8 caracteres)</Label>
            <Input type="password" name="password" value={formData.password} onChange={handleChange} minLength={8} required />
          </FormGroup>
          <FormGroup>
            <Label>Rol</Label>
            <Input type="select" name="rol" value={formData.rol} onChange={handleChange}>
              {Object.values(ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>ID de Empleado (opcional, requerido para Ingeniero Residente y Ventas)</Label>
            <Input type="number" name="empleado_id" value={formData.empleado_id} onChange={handleChange} />
          </FormGroup>
          <Button color="success" type="submit">Crear Usuario</Button>
        </Form>
      </CardBody>
    </Card>
  );
}

export default Register;