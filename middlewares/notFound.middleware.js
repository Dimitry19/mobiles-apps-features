module.exports = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route  ou file inexistant(e)'
  });
};
