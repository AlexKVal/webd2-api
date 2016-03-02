const apiv1 = require('express').Router()

apiv1.use('/users', require('./users'))
apiv1.use('/user-groups', require('./user-groups'))

module.exports = apiv1
