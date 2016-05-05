'use strict'
const debug = require('debug')('webd2-api:relations')
const { find, filter } = require('lodash')

const foreignKey = require('../sql-builder/foreign-key')

class Relations {
  constructor (modelName, modelSchema) {
    if (modelName == null) throw new TypeError('modelName is undefined')
    if (modelSchema == null) throw new TypeError('modelSchema is undefined')
    if (typeof modelSchema !== 'object') throw new TypeError('modelSchema should be an object')
    if (modelSchema.tableName == null) throw new TypeError('modelSchema tableName is undefined')

    debug(`Relations for '${modelName}' model`)

    this.modelName = modelName
    this.modelSchema = modelSchema

    this.fkAsForHasMany = foreignKey(modelName)
  }

  _embedHasMany (parentRows, relationsData) {
    debug(`${this.modelName}:_embedHasMany`)

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

  _embedBelongsTo (parentRows, relationsData) {
    debug(`${this.modelName}:_embedBelongsTo`)

    relationsData = relationsData || this.belongsToDescriptors

    return parentRows.map((parentRow) => {
      relationsData.forEach((rel) => {
        if (rel.rows) {
          parentRow[rel.modelFieldName] = find(rel.rows, { id: parentRow[rel.fkAs] })
        } else {
          parentRow[rel.modelFieldName] = { id: parentRow[rel.fkAs] }
        }
        delete parentRow[rel.fkAs]
      })
      return parentRow
    })
  }
}

module.exports = Relations
