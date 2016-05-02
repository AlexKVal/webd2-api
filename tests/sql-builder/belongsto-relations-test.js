'use strict'
const test = require('tape')

const {
  attributesOfRelations,
  getBelongsToRelations
} = require('../../lib/sql-builder/belongsto-relations')

test('getBelongsToRelations()', (t) => {
  const schemaObject = {
    group: {
      belongsTo: 'userGroup',
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: 'rights'
      /* fkField: is the same, so we can skip it */
    }
  }

  const relations = getBelongsToRelations(schemaObject)
  t.equal(relations.length, 2)
  t.deepEqual(
    relations, [
      {
        relationModelName: 'userGroup',
        modelFieldName: 'group',
        fkField: 'GrpID',
        fkAs: 'userGroupId'
      },
      {
        relationModelName: 'rights',
        modelFieldName: 'rights',
        fkField: 'rights',
        fkAs: 'rightsId'
      }
    ],
    'returns array of "belongsTo" relations'
  )
  t.end()
})

test('attributesOfRelations()', (t) => {
  const registryMock = {
    model (modelName) {
      const _models = {
        userGroup: { attributesSerialize: ['shortName', 'hide'] },
        rights: { attributesSerialize: ['fullName', 'enabled', 'group'] }
      }

      return _models[modelName]
    }
  }

  const belongsToRelations = [
    {
      relationModelName: 'userGroup',
      modelFieldName: 'group'
    }, {
      relationModelName: 'rights',
      modelFieldName: 'rights'
    }
  ]

  t.deepEqual(
    attributesOfRelations(registryMock, belongsToRelations),
    {
      group: ['shortName', 'hide'],
      rights: ['fullName', 'enabled', 'group']
    },
    'returns attributes for all belongsTo relations'
  )
  t.end()
})
