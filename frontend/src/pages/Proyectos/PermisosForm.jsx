import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Spinner } from 'reactstrap';
import { getProyectoById, updatePermisos } from '../../api/proyectosApi';
import { PERMISOS_REQUERIDOS } from '../../utils/constants';

function PermisosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [permisos, setPermisos] = useState({ opamss: false, marn: false, anda: false });
  const [loading, setLoading] = useState(true);

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
    await updatePermisos(id, permisos);
    navigate(`/proyectos/${id}`);
  }

  if (loading) return <Spinner color="primary" />;

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-3">Permisos del Proyecto</h4>
        <Form onSubmit={handleSubmit}>
          {PERMISOS_REQUERIDOS.map((permiso) => {
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