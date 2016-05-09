'use strict'

const test = require('tape')

const parseQueryParams = require('../../lib/utils/parse-query-params')

test.only('parseQueryParams()', (t) => {
  const query = {
    related: true,
    fields: ['id', 'name', 'group'],
    filter: { hide: false },
    order: 'name',

    someUnknownOption: 'value' // it will be ignored
  }

  const parsedOptions = parseQueryParams(query)

  t.equal(parsedOptions.someUnknownOption, undefined, 'unknown option has been ignored')

  t.deepEqual(
    parsedOptions,
    {
      withRelated: true,
      fieldsOnly: ['id', 'name', 'group'],
      where: { hide: false },
      orderBy: 'name'
    },
    'uses only known options'
  )

  function validateParsing (incoming, expected) {
    t.deepEqual(
      parseQueryParams(incoming),
      expected,
      `${JSON.stringify(incoming)} parses to ${JSON.stringify(expected)}`
    )
  }

  validateParsing({related: 'any text value'}, {withRelated: true})
  validateParsing({related: ''}, {withRelated: false})
  validateParsing({/* related is undefined */}, {})
  validateParsing({related: true}, {withRelated: true})
  validateParsing({related: false}, {withRelated: false})

  validateParsing({fields: 'anyString'}, {fieldsOnly: ['anyString']})
  validateParsing({fields: 'id'}, {fieldsOnly: 'id'})
  validateParsing({fields: ['id', 'name', 'group']}, {fieldsOnly: ['id', 'name', 'group']})
  validateParsing({fields: []}, {})

  t.end()
})
