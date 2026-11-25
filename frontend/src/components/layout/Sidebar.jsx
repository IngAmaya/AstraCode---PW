import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

// El orden y la cantidad de estos 13 ítems NO se deben alterar:
// theme.css inserta los títulos de sección (PRINCIPAL, PLANIFICACIÓN, etc.)
// según la posición exacta (nth-child) de cada uno en esta lista.
const menuItems = [
  { label: 'Dashboard', path: '/', roles: null },
  { label: 'Proyectos', path: '/proyectos', roles: null },
  { label: 'Materiales', path: '/inventario/materiales', roles: [ROLES.ADMIN, ROLES.BODEGUERO, ROLES.GERENTE, ROLES.INGENIERO] },
  { label: 'Bodega central', path: '/inventario/bodega-central', roles: [ROLES.ADMIN, ROLES.BODEGUERO, ROLES.GERENTE, ROLES.INGENIERO] },
  { label: 'Bodegas de proyecto', path: '/inventario/bodegas-proyecto', roles: [ROLES.ADMIN, ROLES.BODEGUERO, ROLES.GERENTE, ROLES.INGENIERO] },
  { label: 'Traslados', path: '/inventario/traslados', roles: [ROLES.ADMIN, ROLES.BODEGUERO, ROLES.GERENTE, ROLES.INGENIERO] },
  { label: 'Partidas de obra', path: '/obra/partidas', roles: [ROLES.ADMIN, ROLES.GERENTE, ROLES.INGENIERO] },
  { label: 'Avances de obra', path: '/obra/avances', roles: [ROLES.ADMIN, ROLES.GERENTE, ROLES.INGENIERO] },
  { label: 'Empleados', path: '/rrhh/empleados', roles: [ROLES.ADMIN, ROLES.RRHH] },
  { label: 'Planilla administrativa', path: '/rrhh/planilla-administrativa', roles: [ROLES.ADMIN, ROLES.RRHH] },
  { label: 'Planilla de campo', path: '/rrhh/planilla-campo', roles: [ROLES.ADMIN, ROLES.RRHH] },
  { label: 'Clientes', path: '/ventas/clientes', roles: [ROLES.ADMIN, ROLES.VENTAS] },
  { label: 'Facturación', path: '/ventas/facturacion', roles: [ROLES.ADMIN, ROLES.VENTAS] },
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
        {menuItems.map((item) => {
          const habilitado = !item.roles || (user && item.roles.includes(user.rol));

          return (
            <NavItem key={item.path}>
              {habilitado ? (
                <NavLink
                  tag={Link}
                  to={item.path}
                  className={`text-brand ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  {item.label}
                </NavLink>
              ) : (
                <span
                  className="nav-link text-brand"
                  style={{ opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none', userSelect: 'none' }}
                >
                  {item.label}
                </span>
              )}
            </NavItem>
          );
        })}

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