import express from 'express'

import api from '../api'

const router = express.Router()

router.param('id', api.users.params)

router.route('/')
  .get(api.users.readAll)
  // .post(api.users.create)

router.route('/:id')
  .get(api.users.read)
  // .put(api.users.update)
  // .del(api.users.delete)

// router.put('/password', api.users.changePassword)

export default router
