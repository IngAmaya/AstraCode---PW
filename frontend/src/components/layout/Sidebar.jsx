import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Proyectos', path: '/proyectos' },
  { label: 'Inventario', path: '/inventario/materiales' },
  { label: 'Obra', path: '/obra/avances' },
  { label: 'RRHH', path: '/rrhh/empleados' },
  { label: 'Ventas', path: '/ventas/clientes' },
];

function Sidebar() {
  return (
    <nav style={{ width: '220px', background: '#fff', borderRight: '1px solid var(--color-border)' }}>
      <Nav vertical className="p-3">
        {menuItems.map((item) => (
          <NavItem key={item.path}>
            <NavLink tag={Link} to={item.path} className="text-brand">
              {item.label}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
    </nav>
  );
}

export default Sidebar;