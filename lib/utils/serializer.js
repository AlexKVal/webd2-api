'use strict'

const JSONSerializer = require('jsonapi-serializer').Serializer
const JSONDeserializer = require('jsonapi-serializer').Deserializer
const pluralize = require('pluralize')

const camelCaseKeys = require('./camel-case-keys')

class Serializer {
  constructor (modelName, schema) {
    /**
     * Serializer
     */
    function createSerializerFor (model, relatedIncluded) {
      const options = { attributes: schema.attributes.slice() } // copy
      schema.getBelongsToRelations().forEach((rel) => {
        options[rel.name] = {
          ref: 'id',
          included: relatedIncluded,
          attributes: rel.relationModel.schema.attributes
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

    schema.getBelongsToRelations().forEach((relation) => {
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
  serializeWithRelated (dataSet) {
    return this.serializerWithRelated.serialize(dataSet)
  }

  serializeWithourRelated (dataSet) {
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
