'use strict'

const app = require('express')()
const logger = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const jsonErrors = require('./middleware/json-errors')
const apiV1 = require('./routes/api-v1')

app.use(logger('dev'))

// TODO: make it configurable
app.options('*', cors())
app.use(cors())
app.use(function (req, res, next) {
  res.set({
    'Content-Type': 'application/vnd.api+json',
    'Cache-Control': 'private, must-revalidate, max-age=0',
    'Expires': 'Thu, 01 Jan 1970 00:00:00'
  })

  return next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.disable('x-powered-by')
app.disable('etag')

// routes
app.use('/api/v1', apiV1)
// send proper json-api formatted errors
app.use(jsonErrors)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers
if (app.get('env') === 'development') {
  // development error handler
  // will print stacktrace
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
} else if (app.get('env') === 'production') {
  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
}

module.exports = app
