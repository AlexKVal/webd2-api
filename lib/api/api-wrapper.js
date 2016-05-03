'use strict'
const debug = require('debug')('webd2-api:apiWrapper')
const { find } = require('lodash')

const Serializer = require('../utils/serializer')
const Deserializer = require('../utils/deserializer')
const registry = require('../models/registry')
const {
  attributesOfRelations,
  getBelongsToRelations
} = require('../sql-builder/belongsto-relations')

class ApiWrapper {
  constructor (attrs, registryMockAsSecondArg) {
    let {model, serializer, deserializer, registryMock} = attrs
    if (attrs && attrs.name) {
      model = attrs
      serializer = deserializer = registryMock = undefined
    }

    if (!model || !model.name) throw new TypeError('ApiWrapper needs a model')
    debug(`wrapping of '${model.name}' model`)

    this.model = model
    this.name = model.name
    this.registry = registryMock || registryMockAsSecondArg || registry

    this._belongsToRelations = getBelongsToRelations(model.schema)

    if (serializer) {
      this.serializer = serializer // for testing
    } else {
      this.serializer = new Serializer({
        modelName: model.name,
        attributes: model.attributesSerialize,
        attributesOfRelations: attributesOfRelations(this.registry, this._belongsToRelations)
      })
    }

    if (deserializer) {
      this.deserializer = deserializer // for testing
    } else {
      const modelNamesOfRelations = this._belongsToRelations
        .map((rel) => rel.relationModelName)
      this.deserializer = new Deserializer(modelNamesOfRelations)
    }
  }

  apiCreate (newData) {
    debug(`${this.name}:apiCreate`)

    if (!newData) {
      throw new TypeError(`${this.name}.apiCreate(newData) newData cannot be undefined`)
    }

    return this.deserializer.deserialize(newData)
    .then((deserializedData) => this.model.create(deserializedData))
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiUpdate (id, updates) {
    debug(`${this.name}:apiUpdate(${id})`)

    if (!id || !updates) {
      throw new TypeError(`${this.name}.apiUpdate(id, updates) id and updates cannot be undefined`)
    }

    return this.deserializer.deserialize(updates)
    .then((deserializedData) => this.model.update(id, deserializedData))
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiFind (id) {
    debug(`${this.name}:apiFind(${id})`)

    if (!id) {
      throw new TypeError(`${this.name}.apiFind(id) id cannot be undefined`)
    }

    return this.model.selectOne({id})
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiFetchAll (options) {
    debug(`${this.name}:apiFetchAll`)

    options = options || {}

    return this.model.selectMany(options)
    .then((parentRows) => {
      if (options.withRelated) {
        return this._fetchRelations(parentRows, options.where)
      } else {
        return this._joinRelations(parentRows)
      }
    })
    .then((dataSet) => {
      if (options.withRelated) {
        return this.serializer.withRelated(dataSet)
      } else {
        return this.serializer.withoutRelated(dataSet)
      }
    })
  }

  _joinRelations (parentRows, relations) {
    debug(`${this.name}:_joinRelations`)

    relations = relations || this._belongsToRelations

    return parentRows.map((parentRow) => {
      relations.forEach((rel) => {
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

  /**
   * handles one row
   * thus used in apiMethods that return only one row
   */
  _joinRelationsAndSerialize (row) {
    debug(`${this.name}:_joinRelationsAndSerialize`)

    const dataSet = this._joinRelations([row])[0]
    return this.serializer.withoutRelated(dataSet)
  }

  _fetchRelations (parentRows, parentWhere) {
    debug(`${this.name}:_fetchRelations`)

    const parentTableName = this.model.sqlBuilder.tableName

    return Promise.all(this._belongsToRelations.map((rel) => {
      const relationModel = this.registry.model(rel.relationModelName)
      return relationModel.selectMany({
        whereIn: {
          parentFkName: rel.fkField,
          parentTableName,
          parentWhere
        }
      })
      .then((castRows) => {
        return {
          modelFieldName: rel.modelFieldName,
          fkAs: rel.fkAs,
          rows: castRows
        }
      })
    }))
    .then((relationsData) => this._joinRelations(parentRows, relationsData))
  }
}

module.exports = ApiWrapper
