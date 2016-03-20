'use strict'

const apiv1 = require('express').Router()

/**
 * Public routes
 */
apiv1.use('/user-groups', require('../api/user-groups'))

// generate jwt-token
apiv1.post('/auth', require('../jwt/auth-route'))

/**
 ****************************************************************
 * All routes beneath are protected
 ****************************************************************
 */
apiv1.use(require('../jwt/middleware'))

apiv1.use('/user-accounts', require('../api/user-accounts'))

module.exports = apiv1
