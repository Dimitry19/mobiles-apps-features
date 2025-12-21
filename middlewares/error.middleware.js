module.exports = (err, req, res, next) => {
  console.error('❌ Error:', err);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Une erreur interne est survenue'
  });
};
