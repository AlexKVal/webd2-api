'use strict'

const { Router } = require('express')

const ApiWrapper = require('./api-wrapper')

const registry = require('../models/registry')

const user = registry.model('user')
const userGroup = registry.model('userGroup')
const userAccount = registry.model('userAccount')

module.exports = {
  users: new ApiWrapper(user).connect(Router()),
  userGroups: new ApiWrapper(userGroup).connect(Router(), 'read create update'),
  userAccounts: new ApiWrapper(userAccount).connect(Router(), 'read create update')
}
