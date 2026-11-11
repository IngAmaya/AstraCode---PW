import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import ProyectosList from '../pages/Proyectos/ProyectosList.jsx';
import ProyectoDetalle from '../pages/Proyectos/ProyectoDetalle.jsx';
import ProyectoForm from '../pages/Proyectos/ProyectoForm.jsx';
import PermisosForm from '../pages/Proyectos/PermisosForm.jsx';
import BodegaCentral from '../pages/Inventario/BodegaCentral.jsx';
import BodegasProyecto from '../pages/Inventario/BodegasProyecto.jsx';
import TrasladosForm from '../pages/Inventario/TrasladosForm.jsx';
import MaterialesList from '../pages/Inventario/MaterialesList.jsx';
import AvancesList from '../pages/Obra/AvancesList.jsx';
import AvanceForm from '../pages/Obra/AvanceForm.jsx';
import PartidasObra from '../pages/Obra/PartidasObra.jsx';
import PlanillaAdmin from '../pages/RRHH/PlanillaAdmin.jsx';
import PlanillaCampo from '../pages/RRHH/PlanillaCampo.jsx';
import EmpleadosList from '../pages/RRHH/EmpleadosList.jsx';
import BoletaPago from '../pages/RRHH/BoletaPago.jsx';
import ClientesList from '../pages/Ventas/ClientesList.jsx';
import ClienteForm from '../pages/Ventas/ClienteForm.jsx';
import PlanPagos from '../pages/Ventas/PlanPagos.jsx';
import AbonosForm from '../pages/Ventas/AbonosForm.jsx';
import FacturacionCCF from '../pages/Ventas/FacturacionCCF.jsx';
import Login from '../pages/Auth/Login.jsx';
import Register from '../pages/Auth/Register.jsx';

export default function AppRoutes({ navbar, sidebar }) {
  return (
    <BrowserRouter>
      {navbar}
      <div className="app-body">
        {sidebar}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/proyectos" element={<ProyectosList />} />
            <Route path="/proyectos/nuevo" element={<ProyectoForm />} />
            <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
            <Route path="/proyectos/:id/permisos" element={<PermisosForm />} />
            <Route path="/inventario/bodega-central" element={<BodegaCentral />} />
            <Route path="/inventario/bodegas-proyecto" element={<BodegasProyecto />} />
            <Route path="/inventario/traslados" element={<TrasladosForm />} />
            <Route path="/inventario/materiales" element={<MaterialesList />} />
            <Route path="/obra/avances" element={<AvancesList />} />
            <Route path="/obra/avances/nuevo" element={<AvanceForm />} />
            <Route path="/obra/partidas" element={<PartidasObra />} />
            <Route path="/rrhh/planilla-admin" element={<PlanillaAdmin />} />
            <Route path="/rrhh/planilla-campo" element={<PlanillaCampo />} />
            <Route path="/rrhh/empleados" element={<EmpleadosList />} />
            <Route path="/rrhh/boleta-pago" element={<BoletaPago />} />
            <Route path="/ventas/clientes" element={<ClientesList />} />
            <Route path="/ventas/clientes/nuevo" element={<ClienteForm />} />
            <Route path="/ventas/plan-pagos" element={<PlanPagos />} />
            <Route path="/ventas/abonos" element={<AbonosForm />} />
            <Route path="/ventas/facturacion-ccf" element={<FacturacionCCF />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
