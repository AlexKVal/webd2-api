import express from 'express'

import api from '../api'

const router = express.Router()

/**
 * Users
 */
router.get('/users', api.users.readAll)
// router.post('/users', api.users.create)
router.get('/users/:id', api.users.read)
// router.put('/users/:id', api.users.update)
// router.del('/users/:id', api.users.delete)
// router.put('/users/password', api.users.changePassword)

export default router
