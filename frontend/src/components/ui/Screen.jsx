import React from 'react';

export function Screen({ title, subtitle, actions, children }) {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="screen-actions">{actions}</div>
      </div>
      {children}
    </section>
  );
}

export function Panel({ title, children, actions }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        {title && <h2>{title}</h2>}
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Notice({ error }) {
  return error ? (
    <div className="notice error">
      {error.response?.data?.message ||
        error.message ||
        'Ocurrió un error al consultar la información.'}
    </div>
  ) : null;
}

export function Loading({ busy }) {
  return busy ? <div className="loading">Cargando información…</div> : null;
}

export function Empty({ children = 'No hay registros para mostrar.' }) {
  return <div className="empty">{children}</div>;
}

export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}

export function Table({ columns = [], rows, onRow }) {
  const list = Array.isArray(rows) ? rows : [];

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.id ?? i} onClick={() => onRow?.(r)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!list.length && <Empty />}
    </div>
  );
}

export const money = (v) =>
  Number(v || 0).toLocaleString('es-SV', {
    style: 'currency',
    currency: 'USD',
  });

export const date = (v) =>
  v ? new Date(v).toLocaleDateString('es-SV', { timeZone: 'UTC' }) : '—';