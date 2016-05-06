'use strict'
const test = require('tape')

const DescBelongsTo = require('../../lib/sql-builder/desc-belongsTo')

test('DescBelongsTo: all fields are provided', (t) => {
  const belongsToDescription = new DescBelongsTo('group', {
    belongsTo: 'userGroup',
    fkField: 'GrpID',
    fkAs: 'customNamedId'
  })

  t.equal(belongsToDescription.modelFieldName, 'group')
  t.equal(belongsToDescription.relationModelName, 'userGroup')
  t.equal(belongsToDescription.fkField, 'GrpID')
  t.equal(belongsToDescription.fkAs, 'customNamedId')

  t.end()
})

test('DescBelongsTo: partially provided fields', (t) => {
  t.equal(
    new DescBelongsTo('group', {
      belongsTo: 'userGroup',
      fkField: 'GrpID'
    }).fkAs,
    'userGroupId',
    'autogenerated fkAs is camel cased foreign model name + Id'
  )

  t.equal(
    new DescBelongsTo('group', {
      belongsTo: 'user-group'
    }).fkField,
    'userGroup',
    'autogenerated fkField is camel cased foreign model name'
  )

  t.end()
})

test('DescBelongsTo: throws if no crucial field provided', (t) => {
  t.throws(
    () => new DescBelongsTo('group', {}),
    /belongsTo field is undefined/,
    'belongsTo field is crucial for belongsTo descriptor'
  )

  t.throws(
    () => new DescBelongsTo('group'),
    /descriptorObject attribute is undefined/
  )

  t.throws(
    () => new DescBelongsTo(void 0, {}),
    /modelNameField attribute is undefined/
  )

  t.end()
})
