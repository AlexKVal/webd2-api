'use strict'
const debug = require('debug')('webd2-api:relations')
const { filter } = require('lodash')

const foreignKey = require('../sql-builder/foreign-key')

class Relations {
  constructor (modelName, modelSchema) {
    if (modelName == null) throw new TypeError('modelName is undefined')
    if (modelSchema == null) throw new TypeError('modelSchema is undefined')
    if (typeof modelSchema !== 'object') throw new TypeError('modelSchema should be an object')

    debug(`Relations for '${modelName}' model`)

    this.modelName = modelName
    this.modelSchema = modelSchema

    this.fkAsForHasMany = foreignKey(modelName)
  }

  _joinHasMany (parentRows, relationsData) {
    debug(`${this.modelName}:_joinHasMany`)

    return parentRows.map((parentRow) => {
      relationsData.forEach((rel) => {
        parentRow[rel.modelFieldName] = filter(rel.rows, [this.fkAsForHasMany, parentRow.id])
        .map((relRow) => {
          relRow[rel.parentModelFieldName] = { id: parentRow.id } // reverse connection
          delete relRow[this.fkAsForHasMany]
          return relRow
        })
      })
      return parentRow
    })
  }
}

module.exports = Relations
