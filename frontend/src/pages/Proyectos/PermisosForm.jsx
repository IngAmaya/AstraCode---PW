import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Spinner, Alert } from 'reactstrap';
import { getProyectoById, actualizarPermisos } from '../../api/proyectosApi';
import { ENTIDADES_PERMISO } from '../../utils/constants';

function PermisosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [permisos, setPermisos] = useState({ opamss: false, marn: false, anda: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProyectoById(id).then((proyecto) => {
      if (proyecto) setPermisos(proyecto.permisos);
      setLoading(false);
    });
  }, [id]);

  function toggle(key) {
    setPermisos({ ...permisos, [key]: !permisos[key] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await actualizarPermisos(id, permisos);
      navigate(`/proyectos/${id}`);
    } catch (err) {
      setError('No se pudo actualizar los permisos.');
    }
  }

  if (loading) return <Spinner color="primary" />;

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-3">Permisos del Proyecto</h4>
        {error && <Alert color="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          {ENTIDADES_PERMISO.map((permiso) => {
            const key = permiso.toLowerCase();
            return (
              <FormGroup check key={key} className="mb-2">
                <Label check>
                  <Input type="checkbox" checked={permisos[key]} onChange={() => toggle(key)} />{' '}
                  {permiso} aprobado
                </Label>
              </FormGroup>
            );
          })}
          <Button color="success" type="submit" className="mt-3">Guardar Permisos</Button>
        </Form>
      </CardBody>
    </Card>
  );
}

export default PermisosForm;