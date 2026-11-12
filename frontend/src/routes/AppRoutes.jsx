import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Login from '../pages/Auth/Login.jsx';
import Register from '../pages/Auth/Register.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';

import ProyectosList from '../pages/Proyectos/ProyectosList.jsx';
import ProyectoForm from '../pages/Proyectos/ProyectoForm.jsx';
import ProyectoDetalle from '../pages/Proyectos/ProyectoDetalle.jsx';
import PermisosForm from '../pages/Proyectos/PermisosForm.jsx';

import MaterialesList from '../pages/Inventario/MaterialesList.jsx';
import BodegaCentral from '../pages/Inventario/BodegaCentral.jsx';
import BodegasProyecto from '../pages/Inventario/BodegasProyecto.jsx';
import TrasladosForm from '../pages/Inventario/TrasladosForm.jsx';

import AvancesList from '../pages/Obra/AvancesList.jsx';
import AvanceForm from '../pages/Obra/AvanceForm.jsx';
import PartidasObra from '../pages/Obra/PartidasObra.jsx';

import EmpleadosList from '../pages/RRHH/EmpleadosList.jsx';
import PlanillaAdmin from '../pages/RRHH/PlanillaAdmin.jsx';
import PlanillaCampo from '../pages/RRHH/PlanillaCampo.jsx';
import BoletaPago from '../pages/RRHH/BoletaPago.jsx';

import ClientesList from '../pages/Ventas/ClientesList.jsx';
import ClienteForm from '../pages/Ventas/ClienteForm.jsx';
import PlanPagos from '../pages/Ventas/PlanPagos.jsx';
import AbonosForm from '../pages/Ventas/AbonosForm.jsx';
import FacturacionCCF from '../pages/Ventas/FacturacionCCF.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Dashboard />} />

      <Route path="/proyectos" element={<ProyectosList />} />
      <Route path="/proyectos/nuevo" element={<ProyectoForm />} />
      <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
      <Route path="/proyectos/:id/permisos" element={<PermisosForm />} />

      <Route path="/inventario/materiales" element={<MaterialesList />} />
      <Route path="/inventario/bodega-central" element={<BodegaCentral />} />
      <Route path="/inventario/bodegas-proyecto" element={<BodegasProyecto />} />
      <Route path="/inventario/traslados" element={<TrasladosForm />} />

      <Route path="/obra/avances" element={<AvancesList />} />
      <Route path="/obra/avances/nuevo" element={<AvanceForm />} />
      <Route path="/obra/partidas" element={<PartidasObra />} />

      <Route path="/rrhh/empleados" element={<EmpleadosList />} />
      <Route path="/rrhh/planilla-administrativa" element={<PlanillaAdmin />} />
      <Route path="/rrhh/planilla-campo" element={<PlanillaCampo />} />
      <Route path="/rrhh/boleta/:id" element={<BoletaPago />} />

      <Route path="/ventas/clientes" element={<ClientesList />} />
      <Route path="/ventas/clientes/nuevo" element={<ClienteForm />} />
      <Route path="/ventas/plan-pagos/:clienteId" element={<PlanPagos />} />
      <Route path="/ventas/abonos/:clienteId" element={<AbonosForm />} />
      <Route path="/ventas/facturacion" element={<FacturacionCCF />} />
    </Routes>
  );
}

export default AppRoutes;