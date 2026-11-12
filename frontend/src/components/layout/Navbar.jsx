import React from 'react';
import { Navbar as RsNavbar, NavbarBrand, Nav, NavItem, Button } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <RsNavbar className="navbar-dark bg-brand px-3" expand="md">
      <NavbarBrand href="/">Constructora SV — ERP</NavbarBrand>
      <Nav className="ms-auto" navbar>
        <NavItem className="text-white me-3 d-flex align-items-center">
          {user ? user.nombre : 'Invitado'}
        </NavItem>
        {user && (
          <Button color="light" size="sm" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        )}
      </Nav>
    </RsNavbar>
  );
}

export default Navbar;