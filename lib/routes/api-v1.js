const apiv1 = require('express').Router()

const usersRouter = require('./users')

apiv1.use('/users', usersRouter)

module.exports = apiv1
