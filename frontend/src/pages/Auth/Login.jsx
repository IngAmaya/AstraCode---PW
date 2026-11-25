import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { login } from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';

function Login() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { user, token } = await login({ login: loginValue, password });
      loginContext(user, token);
      navigate('/');
    } catch (err) {
      const status = err?.response?.status;
      const mensajeServidor =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      if (status === 429) {
        setError(
          mensajeServidor ||
            'Has realizado demasiados intentos de inicio de sesión. Espera unos minutos antes de volver a intentarlo.'
        );
      } else {
        setError(mensajeServidor || 'Credenciales inválidas. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
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
              <Label>Usuario o correo electrónico</Label>
              <Input
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                disabled={submitting}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </FormGroup>
            <Button color="primary" type="submit" block disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Login;