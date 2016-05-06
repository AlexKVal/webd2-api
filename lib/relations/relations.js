'use strict'
const debug = require('debug')('webd2-api:relations')
const { find, filter } = require('lodash')

const registry = require('../models/registry')
const foreignKey = require('../sql-builder/foreign-key')
const {
  getHasManyDescriptors,
  getBelongsToDescriptors
} = require('../sql-builder/get-rel-descriptors')

class Relations {
  constructor (modelName, modelSchema, registryMock) {
    if (modelName == null) throw new TypeError('modelName is undefined')
    if (modelSchema == null) throw new TypeError('modelSchema is undefined')
    if (typeof modelSchema !== 'object') throw new TypeError('modelSchema should be an object')
    if (modelSchema.tableName == null) throw new TypeError('modelSchema tableName is undefined')

    debug(`Relations for '${modelName}' model`)

    this.modelName = modelName
    this.modelSchema = modelSchema

    this.registry = registryMock || registry

    this.fkAsForHasMany = foreignKey(modelName)

    this.belongsToDescriptors = getBelongsToDescriptors(modelSchema)
    this.hasManyDescriptors = getHasManyDescriptors(modelSchema)
  }

  getAttributesOfRelations () {
    const result = {}

    this.belongsToDescriptors.forEach((rel) => {
      const relationModel = this.registry.model(rel.relationModelName)
      if (!relationModel) throw new Error(`there is no registered '${rel.relationModelName}' model`)
      result[rel.modelFieldName] = relationModel.asRelationAttributesSerialize
    })

    this.hasManyDescriptors.forEach((rel) => {
      const relationModel = this.registry.model(rel.relationModelName)
      if (!relationModel) throw new Error(`there is no registered '${rel.relationModelName}' model`)
      result[rel.modelFieldName] = relationModel.asRelationAttributesSerialize
    })

    return result
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

  justTransformIDs (parentRows) {
    debug(`${this.modelName}:justTransformIDs`)

    return parentRows.map((parentRow) => {
      this.belongsToDescriptors.forEach((rel) => {
        parentRow[rel.modelFieldName] = { id: parentRow[rel.fkAs] }
        delete parentRow[rel.fkAs]
      })
      return parentRow
    })
  }

  _fetchHasMany (parentWhere) {
    debug(`${this.modelName}:_fetchHasMany`)

    return Promise.all(this.hasManyDescriptors.map((relDescriptor) => {
      const relationModel = this.registry.model(relDescriptor.relationModelName)

      if (!relationModel) {
        return Promise.reject(
          new Error(`_fetchHasMany: there is no registered '${relDescriptor.relationModelName}' model`)
        )
      }

      const parentModelFieldName = findModelFieldName(this.modelName, relationModel.schema)

      return relationModel.selectMany({
        whereIn: {
          relationFkName: relDescriptor.fkField,
          parentIdFieldName: this.modelSchema.id || 'id',
          parentTableName: this.modelSchema.tableName,
          parentWhere
        }
      })
      .then((castRows) => {
        return {
          modelFieldName: relDescriptor.modelFieldName,
          parentModelFieldName,
          rows: castRows
        }
      })
    }))
  }

  _fetchBelongsTo (parentWhere) {
    debug(`${this.modelName}:_fetchBelongsTo`)

    return Promise.all(this.belongsToDescriptors.map((relDescriptor) => {
      const relationModel = this.registry.model(relDescriptor.relationModelName)

      if (!relationModel) {
        return Promise.reject(
          new Error(`_fetchBelongsTo: there is no registered '${relDescriptor.relationModelName}' model`)
        )
      }

      return relationModel.selectMany({
        whereIn: {
          parentFkName: relDescriptor.fkField,
          parentTableName: this.modelSchema.tableName,
          parentWhere
        }
      })
      .then((castRows) => {
        return {
          modelFieldName: relDescriptor.modelFieldName,
          fkAs: relDescriptor.fkAs,
          rows: castRows
        }
      })
    }))
  }

  fetchAndEmbed (parentRows, parentWhere) {
    return this._fetchBelongsTo(parentWhere)
    .then((relationsData) => this._embedBelongsTo(parentRows, relationsData))
    .then(
      (partialResult) => this._fetchHasMany(parentWhere)
      .then((relationsData) => [partialResult, relationsData])
    )
    .then(([partialResult, relationsData]) => this._embedHasMany(partialResult, relationsData))
  }
}

function findModelFieldName (modelName, relModelSchema) {
  const belongsToDescriptors = getBelongsToDescriptors(relModelSchema)
  const relDescriptor = find(belongsToDescriptors, ['relationModelName', modelName])

  if (!relDescriptor) throw new Error(`there is no belongsTo descriptor for '${modelName}'`)

  return relDescriptor.modelFieldName
}

Relations.findModelFieldName = findModelFieldName

module.exports = Relations
