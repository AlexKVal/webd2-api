'use strict'
const debug = require('debug')('webd2-api:apiWrapper')

class ApiWrapper {
  constructor (model) {
    if (!model || !model.name) throw new TypeError('ApiWrapper needs a model')
    debug(`wrap '${model.name}' model`)

    this.model = model
  }
}

module.exports = ApiWrapper
