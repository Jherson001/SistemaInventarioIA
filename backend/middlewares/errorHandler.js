// backend/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('💥 Error:', err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor'
  });
}
module.exports = errorHandler;