'use strict'

const router = require('express').Router()

const userAccount = require('../models/user-account')

const ApiWrapper = require('./api-wrapper')

const wrapper = new ApiWrapper(userAccount)
wrapper.connect(router)

module.exports = router
