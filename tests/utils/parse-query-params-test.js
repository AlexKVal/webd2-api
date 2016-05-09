'use strict'

const test = require('tape')

const parseQueryParams = require('../../lib/utils/parse-query-params')

test('parseQueryParams', (t) => {
  const query = {
    related: true,
    fields: ['id', 'name', 'group'],
    filter: { hide: false },
    order: 'name'
  }

  t.deepEqual(
    parseQueryParams(query),
    {
      withRelated: true,
      fieldsOnly: ['id', 'name', 'group'],
      where: { hide: false },
      orderBy: 'name'
    },
    'uses only known options'
  )
  t.end()
})
