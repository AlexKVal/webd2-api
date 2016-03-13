/**
 * JSON-API compliant errors middleware
 * It should be placed after api routes
 * so it could catch `next(new Error())` errors
 */
function jsonErrors (err, req, res, next) {
  const statusCode = err.status || 500

  const errorToSend = {
    statusCode,
    code: err.code,
    message: err.message,
    stack: (req.app.get('env') !== 'development') ? '' : err.stack
  }

  res.status(statusCode).json({errors: [errorToSend], statusCode})
}

module.exports = jsonErrors
