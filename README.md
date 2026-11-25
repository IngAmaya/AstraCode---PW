# ERP de Gestión Integral — Inmobiliaria y Constructora SV

Sistema web que reúne en un solo lugar la permisología de los proyectos, el inventario de materiales en varias bodegas, los avances de obra, las planillas del personal y las ventas de viviendas con su plan de pagos y su facturación.

Proyecto de cátedra de **Programación Web** (Ciclo 02, 2026), Universidad Centroamericana José Simeón Cañas (UCA). Corresponde al **Caso de negocio 2**.

## Qué hace

| Módulo | Qué resuelve |
|---|---|
| **Planificación y permisología** | Proyectos con sus fases (diseño, terracería, obra gris y acabados). Una obra no puede iniciar si los permisos de OPAMSS, MARN y ANDA no están aprobados. |
| **Bodega e inventario** | Una bodega central y una por proyecto. Los traslados van solo de la central al proyecto, con kardex de cada movimiento y alerta de stock mínimo. |
| **Ejecución de obra** | Partidas con receta de materiales. Al reportar un avance, el sistema descuenta los materiales de la bodega del proyecto y calcula el costo. |
| **Recursos humanos** | Planilla administrativa quincenal (ISSS, AFP y renta) y planilla de campo semanal (por día o a destajo), con boleta de pago. |
| **Ventas e inmobiliaria** | CRM de clientes, plan de pagos con sistema francés y facturación de abonos (recibo, factura y CCF) con IVA. |

El acceso se controla con inicio de sesión (JWT) y seis roles: `ADMIN`, `GERENTE_PROYECTO`, `INGENIERO_RESIDENTE`, `BODEGUERO`, `RRHH` y `VENTAS`.

## Tecnologías

- **Frontend:** React 18, Vite 6, React Router 6, Bootstrap 5, Reactstrap y Axios.
- **Backend:** Node.js, Express 5, `pg`, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors` y `express-rate-limit`.
- **Base de datos:** PostgreSQL 16 en Docker. Sin ORM: las reglas de negocio están en SQL y PL/pgSQL (26 tablas, 12 triggers y 14 funciones).

## Requisitos

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 18 o superior (`node -v`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto y funcionando

## Cómo correrlo

Se necesitan tres terminales: base de datos, backend y frontend.

### 1. Clonar el repositorio

```bash
git clone https://github.com/IngAmaya/AstraCode---PW.git
cd AstraCode---PW
git checkout develop
```

### 2. Base de datos

```bash
cd database
docker compose up -d
```

La primera vez, el contenedor crea la base `constructora_erp_sv` y carga `schema.sql` y `seed.sql` por sí solo. Espera unos 20 segundos a que quede en estado *healthy* (`docker ps`).

Para comprobar que cargó los datos:

```bash
docker exec astracode_constructora_db psql -U postgres -d constructora_erp_sv -c "SELECT username FROM usuarios;"
```

> **Si el puerto 5432 está ocupado o bloqueado** (error `ports are not available`), usa otro puerto. Crea el archivo `database/.env` con `DB_PORT=5433` y vuelve a levantar la base. Después, usa también ese puerto en el `.env` del backend.

### 3. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Edita `backend/.env` para que coincida con la base de datos que levantaste:

```
PORT=3000
JWT_SECRET=una_frase_larga_de_mas_de_32_caracteres
JWT_EXPIRES_IN=8h

DB_HOST=localhost
DB_PORT=5432
DB_NAME=constructora_erp_sv
DB_USER=postgres
DB_PASSWORD=password123
DATABASE_URL=postgresql://postgres:password123@localhost:5432/constructora_erp_sv
```

La clave `password123` es la que usa `docker-compose.yml` por defecto. Si cambiaste el puerto, cámbialo en `DB_PORT` y en `DATABASE_URL`: esa línea tiene prioridad sobre las demás.

Si todo está bien, la terminal muestra:

```
Servidor corriendo en http://localhost:3000
Conectado a PostgreSQL
```

Para probar que responde: <http://localhost:3000/api/health>

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre <http://localhost:5173>. El `.env` del frontend trae `VITE_API_URL=http://localhost:3000/api` y `VITE_USE_MOCK=false`, que son los valores para usar el backend real. Con `VITE_USE_MOCK=true` la interfaz corre con datos simulados y sin servidor.

## Usuarios de prueba

Todos tienen la contraseña **`Admin123*`**.

| Usuario | Rol |
|---|---|
| `admin` | Administrador (acceso a todo) |
| `avasquez` | Ingeniero residente |
| `rmartinez` | Ventas |

El inicio de sesión acepta el nombre de usuario o el correo.

## Estructura del repositorio

```
.
├── backend/
│   └── src/
│       ├── config/db.js          # conexión a PostgreSQL
│       ├── middlewares/          # autenticación, roles y errores
│       ├── modules/              # un módulo por área: routes, controller, service y model
│       ├── routes/index.js       # enrutador principal (/api)
│       ├── utils/
│       ├── app.js
│       └── server.js
├── database/
│   ├── docker-compose.yml
│   ├── schema.sql                # tablas, triggers y funciones
│   ├── seed.sql                  # datos de prueba
│   └── migracion_prima.sql       # solo para una base creada con un esquema anterior
├── frontend/
│   └── src/
│       ├── api/                  # un archivo por módulo, con datos simulados en mocks/
│       ├── components/
│       ├── context/              # estado de sesión y de proyecto
│       ├── hooks/
│       ├── pages/                # Auth, Dashboard, Proyectos, Inventario, Obra, RRHH y Ventas
│       ├── routes/
│       └── utils/
└── docs/                         # documentos del proyecto
```

## API

Todas las rutas van bajo `/api`. Excepto `/api/health` y el inicio de sesión, requieren el encabezado `Authorization: Bearer <token>`.

| Ruta | Quién puede acceder |
|---|---|
| `POST /api/auth/login` | Público |
| `GET /api/auth/perfil` | Usuario con sesión |
| `POST /api/auth/register` | `ADMIN` |
| `/api/proyectos` | Lectura: todos los roles. Escritura: `ADMIN` y `GERENTE_PROYECTO` |
| `/api/inventario` | Lectura: `ADMIN`, `BODEGUERO`, `GERENTE_PROYECTO` e `INGENIERO_RESIDENTE`. Escritura: `ADMIN` y `BODEGUERO` |
| `/api/obra` | Lectura y avances: `ADMIN`, `GERENTE_PROYECTO` e `INGENIERO_RESIDENTE`. Partidas y recetas: `ADMIN` y `GERENTE_PROYECTO` |
| `/api/ventas/clientes`, `/api/ventas` | `ADMIN` y `VENTAS` |
| `/api/rrhh/empleados`, `/api/rrhh/planilla` | `ADMIN` y `RRHH` |
| `GET /api/health` | Público |

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `ports are not available` al levantar Docker | El puerto 5432 está en uso o bloqueado. Usa `DB_PORT=5433` como se explica arriba. |
| `No se pudo conectar a PostgreSQL` | La clave o el puerto del `backend/.env` no coinciden con la base. Revisa `DB_PASSWORD` y, sobre todo, `DATABASE_URL`. |
| La base no tiene datos o quedó con el esquema viejo | Recréala: `docker compose down -v` y luego `docker compose up -d` dentro de `database/`. |
| El navegador bloquea las peticiones (CORS) | El backend solo acepta peticiones desde `http://localhost:5173`. Si Vite usa otro puerto, agrega `FRONTEND_URL` al `.env` del backend. |
| «Demasiados intentos de inicio de sesión» | El login se bloquea tras 10 intentos fallidos en 15 minutos. Reinicia el backend. |
| El frontend no ve los cambios del `.env` | Vite solo lo lee al arrancar. Detén `npm run dev` y vuelve a iniciarlo. |

## Documentación

En la carpeta `docs/` están la presentación del proyecto y el seguimiento de actividades del equipo. El artículo en formato IEEE describe el diseño, el modelo de datos y la arquitectura con más detalle.

## Equipo

- Pablo Andrés Amaya Tenorio
- Jorge Alejandro Erazo Durán
- Elias Fernando Rivera Martinez
- Diego Fernando Canjura Paz
- César Andrés Olmedo Lobos
- César Flavio Pineda Cáceres
- Erick Alejandro Mejicanos Mariona

## Licencia

Consulta el archivo [LICENSE](LICENSE).
