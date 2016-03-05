'use strict'

const _ = require('lodash')
const JSONAPISerializer = require('jsonapi-serializer').Serializer

const User = require('../models/user')
const UserGroup = require('../models/user-groups')
const getSerializer = require('../utils/serializer')
const {debugApi} = require('../utils/debug')
const {
  NotFoundError
} = require('../errors')

function readAll (req, res, next) {
  debugApi('users/readAll')

  Promise.all([ User.all(), UserGroup.all() ])
    .then(([users, groups]) => {
      const dataSet = users.map((user) => {
        user.userGroup = _.find(groups, {'id': user.groupId})
        return user
      })

      let jsonResult = new JSONAPISerializer('user', {
        attributes: ['name', 'userGroup'],
        userGroup: { ref: 'id', attributes: ['name'] }
      }).serialize(dataSet)

      res.send(jsonResult)
    })
    .catch((err) => next(err))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debugApi(`users/params id: ${id}, idInt: ${idInt}`)

  if (isNaN(idInt)) return next(new NotFoundError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debugApi('users/read')

  User.get(req.id)
    .then((data) => res.send(getSerializer('users', User.fields)(data)))
    .catch((err) => next(err))
}

module.exports = {
  readAll,
  params,
  read
}
