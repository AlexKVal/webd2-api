'use strict'

module.exports = class Relations {
  constructor (modelsRegistry) {
    if (modelsRegistry == null) throw new Error('registry is undefined')

    this.registry = modelsRegistry
  }
}
