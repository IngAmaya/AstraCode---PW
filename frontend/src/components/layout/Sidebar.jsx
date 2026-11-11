import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';

const links = [
  ['Dashboard', '/'],
  ['Proyectos', '/proyectos'],
  ['Inventario', '/inventario/bodega-central'],
  ['Obra', '/obra/avances'],
  ['RRHH', '/rrhh/empleados'],
  ['Ventas', '/ventas/clientes'],
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <Nav vertical>
        {links.map(([label, to]) => (
          <NavItem key={to}>
            <NavLink tag={Link} to={to}>{label}</NavLink>
          </NavItem>
        ))}
      </Nav>
    </aside>
  );
}
