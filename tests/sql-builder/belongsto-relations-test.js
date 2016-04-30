'use strict'
const test = require('tape')

const {getBelongsToRelations} = require('../../lib/sql-builder/belongsto-relations')

test('getBelongsToRelations()', (t) => {
  const userGroupModel = { name: 'user-group' }
  const rightsModel = { name: 'rights' }

  const schemaObject = {
    group: {
      belongsTo: userGroupModel,
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: rightsModel,
      fkField: 'rights'
    }
  }

  const relations = getBelongsToRelations(schemaObject)
  t.equal(relations.length, 2)
  t.deepEqual(
    relations, [
      {
        modelFieldName: 'group',
        relationModel: userGroupModel,
        fkField: 'GrpID',
        fkAs: 'userGroupId'
      },
      {
        modelFieldName: 'rights',
        relationModel: rightsModel,
        fkField: 'rights',
        fkAs: 'rightsId'
      }
    ],
    'returns array of "belongsTo" relations'
  )
  t.end()
})
