class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
} //Lanza errores que traen un código HTTP

module.exports = AppError;