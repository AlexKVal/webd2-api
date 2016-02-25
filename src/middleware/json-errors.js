function jsonErrors (err, req, res, next) {
  const statusCode = err.code || 500

  if (req.app.get('env') !== 'development') delete err.stack

  res.status(statusCode).json({errors: [err], statusCode})
}

export default jsonErrors
