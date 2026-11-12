import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { login } from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { user, token } = await login({ email, password });
      loginContext(user, token);
      navigate('/');
    } catch (err) {
      setError('Credenciales inválidas. Intenta de nuevo.');
    }
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px' }}>
        <CardBody>
          <h4 className="text-brand mb-4">Iniciar Sesión</h4>
          {error && <Alert color="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Correo electrónico</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </FormGroup>
            <Button color="primary" type="submit" block>Entrar</Button>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Login;