'use strict'

const router = require('express').Router()
const {BadRequestError} = require('jsonapi-errors/lib/errors')

const { filter } = require('lodash')
const pluralize = require('pluralize')
const Serializer = require('jsonapi-serializer').Serializer
const foreignKey = require('../sql-builder/foreign-key')

const {debugApi} = require('../utils/debug')
const userGroup = require('../models/user-group')

const ApiWrapper = require('./api-wrapper')

class CustomApiWrapper extends ApiWrapper {
  fetchHasMany (relationModelName) {
    const pluralRelationName = pluralize(relationModelName)
    const fkName = foreignKey(this.name)
    const relationModel = this.registry.model(relationModelName)

    const userOptions = (relationModelName === 'user') ? { where: {hide: false}, orderBy: 'name' } : {}

    return Promise.all([ this.model.selectMany(), relationModel.selectMany(userOptions) ])
    .then(([modelRows, relationRows]) => {
      const dataSet = modelRows.map((row) => {
        row[pluralRelationName] = filter(relationRows, [fkName, row.id])
        return row
      })

      const options = { attributes: this.model.sqlBuilder.columnsNames.concat(pluralRelationName) }
      options[pluralRelationName] = { ref: 'id', attributes: relationModel.sqlBuilder.columnsNames }
      const serializer = new Serializer(this.name, options)

      return serializer.serialize(dataSet)
    })
  }
}

const apiWrappedUserGroup = new CustomApiWrapper(userGroup)

function readAll (req, res, next) {
  debugApi('user-group#readAll')

  apiWrappedUserGroup.fetchHasMany('user')
  .then((json) => res.send(json))
  .catch((err) => next(err))
}

function params (req, res, next, id) {
  const idInt = parseInt(id, 10)
  debugApi(`user-group#params id: ${id}`)

  if (isNaN(idInt)) return next(new BadRequestError(`param ${id}`))

  req.id = idInt
  next()
}

function read (req, res, next) {
  debugApi('user-group#read')

  apiWrappedUserGroup.apiFind(req.id)
  .then((data) => res.json(data))
  .catch((err) => next(err))
}

router.param('id', params)

router.route('/')
  .get(readAll)

router.route('/:id')
  .get(read)

module.exports = router
