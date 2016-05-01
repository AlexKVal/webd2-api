'use strict'

const JSONSerializer = require('jsonapi-serializer').Serializer
const JSONDeserializer = require('jsonapi-serializer').Deserializer
const pluralize = require('pluralize')
const {forIn} = require('lodash')

const camelCaseKeys = require('./camel-case-keys')

function serializerOptions (modelAttributes, attributesOfRelations, relatedIncluded) {
  const options = { attributes: modelAttributes, keyForAttribute: 'camelCase' }
  forIn(attributesOfRelations, (relAttrs, modelFieldName) => {
    options[modelFieldName] = {
      ref: 'id',
      attributes: relAttrs,
      included: relatedIncluded
    }
  })
  return options
}

class Serializer {
  constructor ({modelName, attributes, attributesOfRelations, belongsToRelations}) {
    if (!modelName) throw new Error('provide `modelName`')
    if (!attributes) throw new Error('provide `attributes`')
    if (!attributesOfRelations) throw new Error('provide `attributesOfRelations`')

    /**
     * Serializer
     */
    this.serializerWithoutRelated = new JSONSerializer(
      modelName,
      serializerOptions(attributes, attributesOfRelations, false)
    )
    this.serializerWithRelated = new JSONSerializer(
      modelName,
      serializerOptions(attributes, attributesOfRelations, true)
    )

    /**
     * Deserializer
     */
    this.deserializerOptions = {
      keyForAttribute: 'camelCase'
    }

    belongsToRelations.forEach((relation) => {
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

Serializer.serializerOptions = serializerOptions

module.exports = Serializer
