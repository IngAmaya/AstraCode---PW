import React, { useState, useEffect, useCallback } from 'react';
import { Form, FormGroup, Label, Input, Button, Card, CardBody, Alert, Table, Badge } from 'reactstrap';
import { useFetch } from '../../hooks/useFetch';
import { getBodegas, getMateriales, registrarTraslado, getTraslados } from '../../api/inventarioApi';

function TrasladosForm() {
  const { data: bodegas, loading: loadingBodegas } = useFetch(() => getBodegas(), []);
  const { data: materiales, loading: loadingMateriales } = useFetch(getMateriales, []);

  const [formData, setFormData] = useState({
    bodega_origen_id: '',
    bodega_destino_id: '',
    responsable: '',
    observaciones: '',
  });
  const [detalles, setDetalles] = useState([{ material_id: '', cantidad: '' }]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Estado para el historial de traslados
  const [traslados, setTraslados] = useState([]);
  const [loadingTraslados, setLoadingTraslados] = useState(true);
  const [errorTraslados, setErrorTraslados] = useState('');

  const cargarTraslados = useCallback(async () => {
    setLoadingTraslados(true);
    setErrorTraslados('');
    try {
      const data = await getTraslados();
      setTraslados(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorTraslados('No se pudieron cargar los registros de traslados.');
    } finally {
      setLoadingTraslados(false);
    }
  }, []);

  useEffect(() => {
    cargarTraslados();
  }, [cargarTraslados]);

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

  function obtenerNombreBodega(id, nombreDirecto) {
    if (nombreDirecto) return nombreDirecto;
    const encontrada = bodegas?.find((b) => String(b.id) === String(id));
    return encontrada ? encontrada.nombre : `Bodega #${id}`;
  }

  function obtenerNombreMaterial(item) {
    if (item.material_nombre || item.nombre) return item.material_nombre || item.nombre;
    const mat = materiales?.find((m) => String(m.id) === String(item.material_id));
    return mat ? mat.nombre : `Material #${item.material_id}`;
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? fecha : d.toLocaleString();
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
      await cargarTraslados(); // Refresca la tabla abajo
    } catch (err) {
      setError('No se pudo registrar el traslado. Verifica los datos.');
    }
  }

  if (loadingBodegas || loadingMateriales) return null;

  return (
    <>
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

      {/* Tabla de registros de traslados abajo */}
      <Card className="mt-4">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="text-brand mb-0">Registros de Traslados</h4>
            <Button color="outline-secondary" size="sm" onClick={cargarTraslados} disabled={loadingTraslados}>
              {loadingTraslados ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>

          {errorTraslados && <Alert color="danger">{errorTraslados}</Alert>}

          {loadingTraslados ? (
            <p className="text-muted mb-0">Cargando traslados...</p>
          ) : traslados.length === 0 ? (
            <p className="text-muted mb-0">No hay traslados registrados todavía.</p>
          ) : (
            <Table responsive hover striped size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Responsable</th>
                  <th>Materiales</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {traslados.map((t, i) => {
                  const items = t.detalles || t.materiales || [];
                  return (
                    <tr key={t.id ?? i}>
                      <td>{t.id ?? i + 1}</td>
                      <td>{formatearFecha(t.fecha || t.created_at || t.creado_en)}</td>
                      <td>{obtenerNombreBodega(t.bodega_origen_id, t.bodega_origen)}</td>
                      <td>{obtenerNombreBodega(t.bodega_destino_id, t.bodega_destino)}</td>
                      <td>{t.responsable || '—'}</td>
                      <td>
                        {items.length > 0 ? (
                          items.map((item, idx) => (
                            <div key={idx}>
                              <Badge color="light" text="dark" className="border">
                                {obtenerNombreMaterial(item)}: <strong>{item.cantidad}</strong>
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>{t.observaciones || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}

export default TrasladosForm;