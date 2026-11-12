import React from 'react';

function Footer() {
  return (
    <footer className="text-center py-3" style={{ borderTop: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
      © {new Date().getFullYear()} Inmobiliaria y Constructora SV — Todos los derechos reservados.
    </footer>
  );
}

export default Footer;