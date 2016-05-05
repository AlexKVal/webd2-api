'use strict'
const test = require('tape')

const DescHasMany = require('../../lib/sql-builder/desc-hasmany')

test('DescHasMany: all fields are provided', (t) => {
  const hasManyDescription = new DescHasMany('userAccounts', {
    hasMany: 'userAccount',
    fkField: 'GrpID'
  })

  t.equal(hasManyDescription.modelFieldName, 'userAccounts')
  t.equal(hasManyDescription.relationModelName, 'userAccount')
  t.equal(hasManyDescription.fkField, 'GrpID')

  t.end()
})

test('DescHasMany: throws if no crucial field provided', (t) => {
  t.throws(
    () => new DescHasMany('users', {
      hasMany: 'user'
    }),
    /fkField field is undefined/,
    'fkField field is crucial for hasMany descriptor'
  )

  t.throws(
    () => new DescHasMany('users', {}),
    /hasMany field is undefined/,
    'hasMany field is crucial for hasMany descriptor'
  )

  t.throws(
    () => new DescHasMany('users'),
    /descriptorObject attribute is undefined/
  )

  t.throws(
    () => new DescHasMany(void 0, {}),
    /modelNameField attribute is undefined/
  )

  t.end()
})
