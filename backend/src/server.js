require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

// Sin JWT_SECRET el login y la verificación de tokens fallan con errores confusos: se detiene el arranque
const SECRETOS_DEBILES = ['clave_secreta', 'secret', 'changeme', 'cambiar_por_un_secreto_largo_y_aleatorio'];
const secreto = process.env.JWT_SECRET;
if (!secreto) {
  console.error('Falta JWT_SECRET en el archivo .env. Copie .env.example a .env y defina un valor.');
  process.exit(1);
}
if (SECRETOS_DEBILES.includes(secreto) || secreto.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET es débil (use al menos 32 caracteres aleatorios). No se inicia en producción.');
    process.exit(1);
  }
  console.warn('Aviso: JWT_SECRET es débil. Úselo solo en desarrollo; en producción defina uno largo y aleatorio.');
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

  try {
    await pool.query('SELECT 1');
    console.log('Conectado a PostgreSQL');
  } catch (error) {
    console.error('No se pudo conectar a PostgreSQL:', error.message);
  }
});

// Captura errores reales del servidor (como puerto en uso)
server.on('error', (err) => {
  console.error(`No se pudo iniciar en el puerto ${PORT}:`, err.message);
  process.exit(1);
});