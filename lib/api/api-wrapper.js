'use strict'
const debug = require('debug')('webd2-api:apiWrapper')

const Serializer = require('../utils/serializer')
const Deserializer = require('../utils/deserializer')
const Relations = require('../relations/relations')
const registry = require('../models/registry')
const {
  attributesOfRelations
} = require('../sql-builder/get-rel-descriptors')

class ApiWrapper {
  constructor (attrs, registryMockAsSecondArg) {
    let {model, serializer, deserializer, registryMock} = attrs
    if (attrs && attrs.name) {
      model = attrs
      serializer = deserializer = registryMock = undefined
    }

    if (!model || !model.name || !model.schema) {
      throw new TypeError("ApiWrapper needs a model with 'name' and 'schema' fields")
    }
    debug(`wrapping of '${model.name}' model`)

    this.model = model
    this.name = model.name

    this.registry = registryMock || registryMockAsSecondArg || registry

    this.relations = new Relations(model.name, model.schema, this.registry)

    this.belongsToDescriptors = this.relations.belongsToDescriptors
    this.hasManyDescriptors = this.relations.hasManyDescriptors

    if (serializer) {
      this.serializer = serializer // for testing
    } else {
      this.serializer = new Serializer({
        modelName: model.name,
        attributes: model.attributesSerialize,
        attributesOfRelations: attributesOfRelations(this.registry, this.belongsToDescriptors, this.hasManyDescriptors)
      })
    }

    if (deserializer) {
      this.deserializer = deserializer // for testing
    } else {
      const modelNamesOfRelations = this.belongsToDescriptors
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

  apiFetchMany (options) {
    debug(`${this.name}:apiFetchMany`)

    options = options || {}

    return this.model.selectMany(options)
    .then((parentRows) => {
      if (options.withRelated) {
        return this.relations.fetchAndEmbed(parentRows, options.where)
      } else {
        return this.relations.justTransformIDs(parentRows)
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

  _joinBelongsToRelations (parentRows, relations) {
    debug(`${this.name}:_joinBelongsToRelations`)

    relations = relations || this.belongsToDescriptors

    return this.relations._embedBelongsTo(parentRows, relations)
  }

  _joinHasManyRelations (parentRows, relations) {
    debug(`${this.name}:_joinHasManyRelations`)

    return this.relations._embedHasMany(parentRows, relations)
  }

  /**
   * handles one row
   * thus used in apiMethods that return only one row
   */
  _joinRelationsAndSerialize (row) {
    debug(`${this.name}:_joinRelationsAndSerialize`)

    const dataSet = this._joinBelongsToRelations([row])[0]
    return this.serializer.withoutRelated(dataSet)
  }

  _fetchRelations (parentRows, parentWhere) {
    debug(`${this.name}:_fetchRelations`)

    return this.relations._fetchBelongsTo(parentWhere)
    .then((relationsData) => this._joinBelongsToRelations(parentRows, relationsData))
  }

  _fetchHasManyRelations (parentWhere) {
    debug(`${this.name}:_fetchHasManyRelations`)

    return this.relations._fetchHasMany(parentWhere)
  }
}

module.exports = ApiWrapper
