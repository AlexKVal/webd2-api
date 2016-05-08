'use strict'

const router = require('express').Router()

const user = require('../models/user')

const ApiWrapper = require('./api-wrapper')

const wrapper = new ApiWrapper(user)

wrapper.connect(router)

module.exports = router
