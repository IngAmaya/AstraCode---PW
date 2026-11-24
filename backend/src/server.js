require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async (err) => {
  if (err) {
    console.error(`No se pudo iniciar en el puerto ${PORT}:`, err.message);
    process.exit(1);
  }
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

  try {
    await pool.query('SELECT 1');
    console.log('Conectado a PostgreSQL');
  } catch (error) {
    console.error('No se pudo conectar a PostgreSQL:', error.message);
  }
});