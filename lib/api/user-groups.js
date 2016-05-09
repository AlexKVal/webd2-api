'use strict'

const router = require('express').Router()

const userGroup = require('../models/user-group')

const ApiWrapper = require('./api-wrapper')

const wrapper = new ApiWrapper(userGroup)

wrapper.connect(router)

module.exports = router
