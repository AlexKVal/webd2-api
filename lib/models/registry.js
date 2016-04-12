'use strict'

const userAccount = require('./user-account')
const userGroup = require('./user-group')
const user = require('./user')

module.exports = {
  'user-account': userAccount,
  'user-group': userGroup,
  user: user
}
