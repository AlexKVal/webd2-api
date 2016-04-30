'use strict'

const registry = {}

function preventOverwrite (store, name) {
  if (store[name]) throw new Error(name + ' is already defined in the registry')
}

/**
 * Usage:
 *
 * to register new model
 * class User extends BaseModel {<custom model's methods>}
 * User.schemaObject = {<model's schema>}
 * module.exports = registry.model('User', User)
 *
 * to retrieve registered model
 * const userModel = registry.model('User')
 */
registry.model = function (name, ModelClass, db) {
  if (ModelClass && !db) {
    db = require('../utils/database').getDatabase() // for tests
  }

  this._models = this._models || Object.create(null)
  if (ModelClass) {
    if (!ModelClass.schemaObject) throw new Error('you need to define `ModelClass.schemaObject`')

    preventOverwrite(this._models, name)

    this._models[name] = new ModelClass({
      registry,
      db,
      name,
      schema: ModelClass.schemaObject
    })
  }
  return this._models[name]
}

module.exports = registry
