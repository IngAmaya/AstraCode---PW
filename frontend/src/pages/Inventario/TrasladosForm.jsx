import React, { useState } from 'react';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Alert, Table } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getBodegas, registrarTraslado } from '../../api/inventarioApi';
import { getMateriales } from '../../api/inventarioApi';

function TrasladosForm() {
  const { data: bodegas, loading: loadingBodegas } = useFetch(() => getBodegas(), []);
  const { data: materiales, loading: loadingMateriales } = useFetch(getMateriales, []);

  const [formData, setFormData] = useState({
    bodega_origen_id: '', bodega_destino_id: '', responsable: '', observaciones: '',
  });
  const [detalles, setDetalles] = useState([{ material_id: '', cantidad: '' }]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleDetalleChange(index, field, value) {
    const nuevos = [...detalles];
    nuevos[index][field] = value;
    setDetalles(nuevos);
  }

  function agregarFila() {
    setDetalles([...detalles, { material_id: '', cantidad: '' }]);
  }

  function quitarFila(index) {
    setDetalles(detalles.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await registrarTraslado({
        ...formData,
        detalles: detalles
          .filter((d) => d.material_id && d.cantidad)
          .map((d) => ({ material_id: Number(d.material_id), cantidad: Number(d.cantidad) })),
      });
      setSuccess(true);
      setFormData({ bodega_origen_id: '', bodega_destino_id: '', responsable: '', observaciones: '' });
      setDetalles([{ material_id: '', cantidad: '' }]);
    } catch (err) {
      setError('No se pudo registrar el traslado. Verifica los datos.');
    }
  }

  if (loadingBodegas || loadingMateriales) return null;

  return (
    <Card>
      <CardBody>
        <h4 className="text-brand mb-3">Nuevo Traslado</h4>
        {success && <Alert color="success">Traslado registrado correctamente.</Alert>}
        {error && <Alert color="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Bodega Origen</Label>
            <Input type="select" name="bodega_origen_id" value={formData.bodega_origen_id} onChange={handleChange} required>
              <option value="">Selecciona...</option>
              {bodegas && bodegas.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Bodega Destino</Label>
            <Input type="select" name="bodega_destino_id" value={formData.bodega_destino_id} onChange={handleChange} required>
              <option value="">Selecciona...</option>
              {bodegas && bodegas.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Responsable</Label>
            <Input name="responsable" value={formData.responsable} onChange={handleChange} required />
          </FormGroup>
          <FormGroup>
            <Label>Observaciones</Label>
            <Input type="textarea" name="observaciones" value={formData.observaciones} onChange={handleChange} />
          </FormGroup>

          <Label>Materiales a trasladar</Label>
          <Table size="sm" className="mb-2">
            <thead>
              <tr><th>Material</th><th>Cantidad</th><th></th></tr>
            </thead>
            <tbody>
              {detalles.map((d, index) => (
                <tr key={index}>
                  <td>
                    <Input
                      type="select"
                      value={d.material_id}
                      onChange={(e) => handleDetalleChange(index, 'material_id', e.target.value)}
                    >
                      <option value="">Selecciona...</option>
                      {materiales && materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </Input>
                  </td>
                  <td>
                    <Input
                      type="number"
                      min="1"
                      value={d.cantidad}
                      onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                    />
                  </td>
                  <td>
                    {detalles.length > 1 && (
                      <Button color="danger" size="sm" onClick={() => quitarFila(index)}>×</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button color="secondary" size="sm" className="mb-3" onClick={agregarFila} type="button">
            + Agregar material
          </Button>
          <br />
          <Button color="success" type="submit">Registrar Traslado</Button>
        </Form>
      </CardBody>
    </Card>
  );
}

export default TrasladosForm;