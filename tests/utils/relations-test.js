'use strict'
const test = require('tape')

const Relations = require('../../lib/utils/relations')

test.only('Relations: constructor requires registry of models', (t) => {
  const registry = {
    model1: {},
    model2: {}
  }
  t.doesNotThrow(() => new Relations(registry))
  t.throws(() => new Relations(undefined), /registry is undefined/)
  t.end()
})
