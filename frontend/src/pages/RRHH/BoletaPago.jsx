import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBoleta } from '../../api/rrhhApi';
import {
  Screen,
  Panel,
  Notice,
  money,
  date,
  Loading,
} from '../../components/ui/Screen';

export default function BoletaPago() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    getBoleta(id)
      .then(setData)
      .catch(setError)
      .finally(() => setBusy(false));
  }, [id]);

  const formatValue = (k, v) => {
    if (k.includes('salario') || k.includes('descuento')) return money(v);
    if (k.includes('fecha')) return date(v);
    return String(v);
  };

  return (
    <Screen
      title="Boleta de pago"
      subtitle="Detalle individual de remuneración."
    >
      <Notice error={error} />
      <Loading busy={busy} />

      {data && (
        <Panel title={data.empleado || 'Detalle de pago'}>
          <div className="detail-grid">
            {Object.entries(data)
              .filter(([k, v]) => v !== null && typeof v !== 'object')
              .map(([k, v]) => (
                <div key={k}>
                  <span>{k.replaceAll('_', ' ')}</span>
                  <b>{formatValue(k, v)}</b>
                </div>
              ))}
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={() => window.print()}
          >
            Imprimir boleta
          </button>
        </Panel>
      )}
    </Screen>
  );
}