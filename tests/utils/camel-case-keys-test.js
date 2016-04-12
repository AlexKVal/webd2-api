'use strict'
const test = require('tape')

const camelCaseKeys = require('../../lib/utils/camel-case-keys')

test('camelizes all dasherized keys', (t) => {
  const data = {
    id: '45',
    name: 'Admin',
    'user-group': '1',
    'user-rights': '3'
  }

  const normalized = camelCaseKeys(data)

  t.equal(normalized.id, '45')
  t.equal(normalized.name, 'Admin')
  t.equal(normalized.userGroup, '1')
  t.equal(normalized.userRights, '3')
  t.notok(normalized['user-group'])
  t.notok(normalized['user-rights'])

  t.deepEqual(data, {
    id: '45',
    name: 'Admin',
    userGroup: '1',
    userRights: '3'
  })

  t.end()
})
