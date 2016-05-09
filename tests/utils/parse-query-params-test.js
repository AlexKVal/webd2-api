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
      orderBy: ['name']
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

  validateParsing({related: true}, {withRelated: true})
  validateParsing({related: false}, {withRelated: false})
  validateParsing({related: 'any text value'}, {})
  validateParsing({related: 123}, {})
  validateParsing({related: ''}, {})
  validateParsing({related: []}, {})
  validateParsing({/* related is undefined */}, {})

  validateParsing({fields: 'anyString'}, {fieldsOnly: ['anyString']})
  validateParsing({fields: 'id'}, {fieldsOnly: 'id'})
  validateParsing({fields: ['id', 'name', 'group']}, {fieldsOnly: ['id', 'name', 'group']})
  validateParsing({fields: ''}, {})
  validateParsing({fields: []}, {})

  validateParsing({order: 'anyString'}, {orderBy: ['anyString']})
  validateParsing({order: 'name DESC'}, {orderBy: ['name DESC']})
  validateParsing({order: ['name', 'group']}, {orderBy: ['name', 'group']})
  validateParsing({order: ['name DESC', 'group ASC']}, {orderBy: ['name DESC', 'group ASC']})
  validateParsing({order: '; select *'}, {})
  validateParsing({order: 'name, group'}, {})
  validateParsing({order: 'name DESC some evil'}, {})
  validateParsing({order: 'name SOME'}, {})
  validateParsing({order: ''}, {})
  validateParsing({order: []}, {})

  t.end()
})
