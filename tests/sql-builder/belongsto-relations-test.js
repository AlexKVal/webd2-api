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
      const schemas = {
        rights: {
          fullName: 'string',
          enabled: 'boolean',
          group: {
            belongsTo: 'rightsGroup'
          }
        },
        userGroup: {
          shortName: 'string',
          hide: 'boolean'
        }
      }

      return {
        name: modelName,
        sqlBuilder: {
          schemaObject: schemas[modelName]
        }
      }
    }
  }

  const parentSchema = {
    name: 'string',
    hide: 'boolean',
    group: {
      belongsTo: 'userGroup',
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: 'rights'
    }
  }

  t.deepEqual(
    attributesOfRelations(registryMock, parentSchema),
    {
      group: ['shortName', 'hide'],
      rights: ['fullName', 'enabled', 'group']
    },
    'returns attributes for all belongsTo relations'
  )
  t.end()
})
