function jsonErrors (err, req, res, next) {
  const statusCode = err.code || 500

  const errorToSend = {
    statusCode,
    message: err.message,
    stack: (req.app.get('env') !== 'development') ? '' : err.stack
  }

  res.status(statusCode).json({errors: [errorToSend], statusCode})
}

module.exports = jsonErrors
