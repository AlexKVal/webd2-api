const router = require('express').Router()

const api = require('../api')

router.route('/')
  .get(api.userGroups.readAll)

module.exports = router
