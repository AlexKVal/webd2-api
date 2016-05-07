'use strict'
const debug = require('debug')('webd2-api:apiWrapper')

const Serializer = require('../utils/serializer')
const Deserializer = require('../utils/deserializer')
const Relations = require('../relations/relations')

class ApiWrapper {
  constructor (attrs, registryMoc) {
    let {model, serializer, deserializer} = attrs
    if (attrs && attrs.name) {
      model = attrs
      serializer = deserializer = undefined
    }

    if (!model || !model.name || !model.schema) {
      throw new TypeError("ApiWrapper needs a model with 'name' and 'schema' fields")
    }
    debug(`wrapping of '${model.name}' model`)

    this.model = model

    this.relations = new Relations(model.name, model.schema, registryMoc)

    if (serializer) {
      this.serializer = serializer // for testing
    } else {
      this.serializer = new Serializer({
        modelName: model.name,
        attributes: model.attributesSerialize,
        attributesOfRelations: this.relations.getAttributesOfRelations()
      })
    }

    if (deserializer) {
      this.deserializer = deserializer // for testing
    } else {
      const modelNamesOfRelations = this.relations.belongsToDescriptors
      .map((rel) => rel.relationModelName)
      this.deserializer = new Deserializer(modelNamesOfRelations)
    }
  }

  apiCreate (newData) {
    debug(`${this.model.name}:apiCreate`)

    if (!newData) {
      throw new TypeError(`${this.model.name}.apiCreate(newData) newData cannot be undefined`)
    }

    return this.deserializer.deserialize(newData)
    .then((deserializedData) => this.model.create(deserializedData))
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiUpdate (id, updates) {
    debug(`${this.model.name}:apiUpdate(${id})`)

    if (!id || !updates) {
      throw new TypeError(`${this.model.name}.apiUpdate(id, updates) id and updates cannot be undefined`)
    }

    return this.deserializer.deserialize(updates)
    .then((deserializedData) => this.model.update(id, deserializedData))
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiFind (id) {
    debug(`${this.model.name}:apiFind(${id})`)

    if (!id) {
      throw new TypeError(`${this.model.name}.apiFind(id) id cannot be undefined`)
    }

    return this.model.selectOne({id})
    .then((record) => this._joinRelationsAndSerialize(record))
  }

  apiFetchMany (options) {
    debug(`${this.model.name}:apiFetchMany`)

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

  /**
   * handles one row
   * thus used in apiMethods that return only one row
   */
  _joinRelationsAndSerialize (row) {
    debug(`${this.model.name}:_joinRelationsAndSerialize`)

    const dataSet = this.relations.justTransformIDs([row])[0]
    return this.serializer.withoutRelated(dataSet)
  }
}

module.exports = ApiWrapper
