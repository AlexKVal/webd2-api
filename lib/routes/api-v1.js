'use strict'

const apiv1 = require('express').Router()

const authenticateRoute = require('../jwt/auth-route')
const verifyJWT = require('../jwt/middleware')

apiv1.use('/users', require('./users'))
apiv1.use('/user-groups', require('./user-groups'))

// generate jwt-token
apiv1.post('/auth', authenticateRoute)

/**
 * All routes beneath are protected
 */
apiv1.use(verifyJWT)

apiv1.use('/user-accounts', require('./users')) // TODO

module.exports = apiv1
