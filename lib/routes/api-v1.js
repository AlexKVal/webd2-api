'use strict'

const apiv1 = require('express').Router()

/**
 * Public routes
 */
apiv1.use('/user-groups', require('../api/user-groups'))

// for hasMany apiFetchMany({withRelated: false}) testing
apiv1.use('/users', require('../api/users'))

// generate jwt-token
apiv1.post('/auth', require('../jwt/auth-route'))

/**
 ****************************************************************
 * All routes beneath are protected
 ****************************************************************
 */
apiv1.use(require('../jwt/middleware'))

/**
 * Here go all authenticated users' routes (waiters)
 */

 /**
  * Here go administrator' routes (bartenders and cachiers too)
  */
// apiv1.use(adminsMiddleware)

/**
 * And the last routes are only for super-admins
 */
apiv1.use(require('../middleware-rights/super-admins-only'))

apiv1.use('/user-accounts', require('../api/user-accounts'))

module.exports = apiv1
