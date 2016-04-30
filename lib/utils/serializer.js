'use strict'

const JSONSerializer = require('jsonapi-serializer').Serializer
const JSONDeserializer = require('jsonapi-serializer').Deserializer
const pluralize = require('pluralize')

const {getBelongsToRelations} = require('../sql-builder/belongsto-relations')
const camelCaseKeys = require('./camel-case-keys')

class Serializer {
  constructor (modelName, schemaObject) {
    /**
     * Serializer
     */
    function createSerializerFor (model, relatedIncluded) {
      const options = { attributes: Object.keys(schemaObject) }
      getBelongsToRelations(schemaObject).forEach((rel) => {
        options[rel.modelFieldName] = {
          ref: 'id',
          included: relatedIncluded,
          attributes: Object.keys(rel.relationModel.schemaObject)
        }
      })
      return new JSONSerializer(modelName, options)
    }

    this.serializerWithoutRelated = createSerializerFor(this, false)
    this.serializerWithRelated = createSerializerFor(this, true)

    /**
     * Deserializer
     */
    this.deserializerOptions = {
      keyForAttribute: 'camelCase'
    }

    getBelongsToRelations(schemaObject).forEach((relation) => {
      const pluralModelName = pluralize(relation.relationModel.name)
      this.deserializerOptions[pluralModelName] = {
        valueForRelationship (rel) { return { id: rel.id } }
      }
    })

    this.deserializer = new JSONDeserializer(this.deserializerOptions)
  }

  /**
   * Serializers
   */
  withRelated (dataSet) {
    return this.serializerWithRelated.serialize(dataSet)
  }

  withoutRelated (dataSet) {
    return this.serializerWithoutRelated.serialize(dataSet)
  }

  /**
   * Deserializer
   */
  deserialize (dataSet) {
    return new Promise((resolve, reject) => {
      this.deserializer.deserialize(dataSet, (error, deserializedData) => {
        if (error) reject(error)

        // jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
        camelCaseKeys(deserializedData)

        // return deserialized 'data' with camelCased keys
        resolve(deserializedData)
      })
    })
  }
}

module.exports = Serializer
