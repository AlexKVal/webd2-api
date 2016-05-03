'use strict'
const debug = require('debug')('webd2-api:apiWrapper')

const {
  // attributesOfRelations,
  getBelongsToRelations
} = require('../sql-builder/belongsto-relations')
const Deserializer = require('../utils/deserializer')

class ApiWrapper {
  constructor ({model, deserializer}) {
    if (!model || !model.name) throw new TypeError('ApiWrapper needs a model')
    debug(`wrap '${model.name}' model`)

    this.model = model
    this.name = model.name

    this._belongsToRelations = getBelongsToRelations(model.schema)

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
}

module.exports = ApiWrapper
