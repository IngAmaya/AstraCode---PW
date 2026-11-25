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

import ProtectedRoute from './ProtectedRoute.jsx';
import { ROLES } from '../utils/constants.js';

function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Protegida: solo ADMIN puede crear usuarios */}
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute rolesPermitidos={[ROLES.ADMIN]}>
            <Register />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/proyectos" element={<ProtectedRoute><ProyectosList /></ProtectedRoute>} />
      <Route path="/proyectos/nuevo" element={<ProtectedRoute><ProyectoForm /></ProtectedRoute>} />
      <Route path="/proyectos/:id" element={<ProtectedRoute><ProyectoDetalle /></ProtectedRoute>} />
      <Route path="/proyectos/:id/permisos" element={<ProtectedRoute><PermisosForm /></ProtectedRoute>} />

      <Route path="/inventario/materiales" element={<ProtectedRoute><MaterialesList /></ProtectedRoute>} />
      <Route path="/inventario/bodega-central" element={<ProtectedRoute><BodegaCentral /></ProtectedRoute>} />
      <Route path="/inventario/bodegas-proyecto" element={<ProtectedRoute><BodegasProyecto /></ProtectedRoute>} />
      <Route path="/inventario/traslados" element={<ProtectedRoute><TrasladosForm /></ProtectedRoute>} />

      <Route path="/obra/avances" element={<ProtectedRoute><AvancesList /></ProtectedRoute>} />
      <Route path="/obra/avances/nuevo" element={<ProtectedRoute><AvanceForm /></ProtectedRoute>} />
      <Route path="/obra/partidas" element={<ProtectedRoute><PartidasObra /></ProtectedRoute>} />

      <Route path="/rrhh/empleados" element={<ProtectedRoute><EmpleadosList /></ProtectedRoute>} />
      <Route path="/rrhh/planilla-administrativa" element={<ProtectedRoute><PlanillaAdmin /></ProtectedRoute>} />
      <Route path="/rrhh/planilla-campo" element={<ProtectedRoute><PlanillaCampo /></ProtectedRoute>} />
      <Route path="/rrhh/boleta/:id" element={<ProtectedRoute><BoletaPago /></ProtectedRoute>} />

      <Route path="/ventas/clientes" element={<ProtectedRoute><ClientesList /></ProtectedRoute>} />
      <Route path="/ventas/clientes/nuevo" element={<ProtectedRoute><ClienteForm /></ProtectedRoute>} />
      <Route path="/ventas/plan-pagos/:clienteId" element={<ProtectedRoute><PlanPagos /></ProtectedRoute>} />
      <Route path="/ventas/abonos/:clienteId" element={<ProtectedRoute><AbonosForm /></ProtectedRoute>} />
      <Route path="/ventas/facturacion" element={<ProtectedRoute><FacturacionCCF /></ProtectedRoute>} />
    </Routes>
  );
}

export default AppRoutes;