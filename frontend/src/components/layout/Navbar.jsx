import { Navbar as ReactstrapNavbar, NavbarBrand } from 'reactstrap';

export default function Navbar() {
  return (
    <ReactstrapNavbar color="dark" dark className="px-3">
      <NavbarBrand href="/">AstraCode ERP</NavbarBrand>
    </ReactstrapNavbar>
  );
}
