const notFound = (req, res, next) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode === 500) console.error(err);
  res.status(statusCode).json({
    ok: false,
    message: statusCode === 500 ? 'Error interno del servidor' : err.message,
  });
};

module.exports = { notFound, errorHandler };