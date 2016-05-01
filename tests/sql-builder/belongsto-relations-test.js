'use strict'
const test = require('tape')

const {getBelongsToRelations} = require('../../lib/sql-builder/belongsto-relations')

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
