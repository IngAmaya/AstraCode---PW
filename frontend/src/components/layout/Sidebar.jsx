
import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const menuItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Proyectos', path: '/proyectos' },
  { label: 'Materiales', path: '/inventario/materiales' },
  { label: 'Bodega central', path: '/inventario/bodega-central' },
  { label: 'Bodegas de proyecto', path: '/inventario/bodegas-proyecto' },
  { label: 'Traslados', path: '/inventario/traslados' },
  { label: 'Partidas de obra', path: '/obra/partidas' },
  { label: 'Avances de obra', path: '/obra/avances' },
  { label: 'Empleados', path: '/rrhh/empleados' },
  { label: 'Planilla administrativa', path: '/rrhh/planilla-administrativa' },
  { label: 'Planilla de campo', path: '/rrhh/planilla-campo' },
  { label: 'Clientes', path: '/ventas/clientes' },
  { label: 'Facturación', path: '/ventas/facturacion' },
];

function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <nav style={{
      width: '220px',
      background: '#fff',
      borderRight: '1px solid var(--color-border)'
    }}>
      <Nav vertical className="p-3">
        {menuItems.map((item) => (
          <NavItem key={item.path}>
            <NavLink
              tag={Link}
              to={item.path}
              className={`text-brand ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              {item.label}
            </NavLink>
          </NavItem>
        ))}

        {user && user.rol === ROLES.ADMIN && (
          <NavItem>
            <NavLink
              tag={Link}
              to="/admin/usuarios"
              className={`text-brand ${
                location.pathname === '/admin/usuarios' ? 'active' : ''
              }`}
            >
              Gestión de Usuarios
            </NavLink>
          </NavItem>
        )}
      </Nav>
    </nav>
  );
}

export default Sidebar;
