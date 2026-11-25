
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getProyectos } from '../../api/proyectosApi';
import { getMateriales } from '../../api/inventarioApi';
import { getAvances } from '../../api/obraApi';
import { getEmpleados } from '../../api/rrhhApi';
import { getClientes, getFacturas } from '../../api/ventasApi';

import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

import {
  Screen,
  Panel,
  Notice,
  Loading
} from '../../components/ui/Screen';

export default function Dashboard() {
  const { user } = useAuth();

  const [s, setS] = useState({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);

  // Determinar qué información puede consultar cada rol.
  const permisos = {
    [ROLES.ADMIN]: [
      'proyectos',
      'materiales',
      'avances',
      'empleados',
      'clientes',
      'facturas'
    ],

    [ROLES.GERENTE]: [
      'proyectos',
      'materiales',
      'avances'
    ],

    [ROLES.INGENIERO]: [
      'proyectos',
      'materiales',
      'avances'
    ],

    [ROLES.BODEGUERO]: [
      'proyectos',
      'materiales'
    ],

    [ROLES.RRHH]: [
      'proyectos',
      'empleados'
    ],

    [ROLES.VENTAS]: [
      'proyectos',
      'clientes',
      'facturas'
    ]
  };

  const accesos = {
    proyectos: {
      titulo: 'Proyectos',
      url: '/proyectos'
    },

    materiales: {
      titulo: 'Materiales',
      url: '/inventario/materiales'
    },

    avances: {
      titulo: 'Avances registrados',
      url: '/obra/avances'
    },

    empleados: {
      titulo: 'Empleados',
      url: '/rrhh/empleados'
    },

    clientes: {
      titulo: 'Clientes',
      url: '/ventas/clientes'
    },

    facturas: {
      titulo: 'Documentos fiscales',
      url: '/ventas/facturacion'
    }
  };

  const consultas = {
    proyectos: getProyectos,
    materiales: getMateriales,
    avances: getAvances,
    empleados: getEmpleados,
    clientes: getClientes,
    facturas: getFacturas
  };

  const accesosRapidos = [
    {
      titulo: 'Registrar avance',
      url: '/obra/avances/nuevo',
      roles: [ROLES.ADMIN, ROLES.GERENTE, ROLES.INGENIERO]
    },
    {
      titulo: 'Crear cliente',
      url: '/ventas/clientes/nuevo',
      roles: [ROLES.ADMIN, ROLES.VENTAS]
    },
    {
      titulo: 'Generar planilla',
      url: '/rrhh/planilla-administrativa',
      roles: [ROLES.ADMIN, ROLES.RRHH]
    },
    {
      titulo: 'Registrar traslado',
      url: '/inventario/traslados',
      roles: [ROLES.ADMIN, ROLES.BODEGUERO]
    }
  ];

  useEffect(() => {
    async function cargarDashboard() {
      setBusy(true);
      setError(null);
      setS({});

      const modulosPermitidos = permisos[user?.rol] || [];

      const resultados = await Promise.allSettled(
        modulosPermitidos.map(async (modulo) => ({
          modulo,
          datos: await consultas[modulo]()
        }))
      );

      const nuevaInformacion = {};
      let huboError = false;

      resultados.forEach((resultado) => {
        if (resultado.status === 'fulfilled') {
          const { modulo, datos } = resultado.value;

          nuevaInformacion[modulo] = Array.isArray(datos)
            ? datos
            : [];
        } else {
          huboError = true;
        }
      });

      setS(nuevaInformacion);

      if (huboError) {
        setError(
          'No se pudo cargar toda la información disponible del Dashboard.'
        );
      }

      setBusy(false);
    }

    if (user) {
      cargarDashboard();
    }
  }, [user?.rol]);

  const modulosPermitidos = permisos[user?.rol] || [];

  return (
    <Screen
      title="Panel de control"
      subtitle="Resumen general de la operación de la constructora."
    >
      <Notice error={error} />

      <Loading busy={busy} />

      {!busy && (
        <>
          <div className="stats-grid">
            {modulosPermitidos.map((modulo) => (
              <Link
                className="stat-card"
                to={accesos[modulo].url}
                key={modulo}
              >
                <span>{accesos[modulo].titulo}</span>

                <strong>
                  {s[modulo]?.length ?? 0}
                </strong>

                <small>Ver módulo →</small>
              </Link>
            ))}
          </div>

          <Panel title="Accesos rápidos">
            <div className="quick-links">
              {accesosRapidos
                .filter((acceso) =>
                  acceso.roles.includes(user?.rol)
                )
                .map((acceso) => (
                  <Link
                    to={acceso.url}
                    key={acceso.url}
                  >
                    {acceso.titulo}
                  </Link>
                ))}
            </div>
          </Panel>
        </>
      )}
    </Screen>
  );
}
