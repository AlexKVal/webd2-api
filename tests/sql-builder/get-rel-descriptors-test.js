'use strict'
const test = require('tape')

const {
  attributesOfRelations,
  getHasManyDescriptors,
  getBelongsToDescriptors
} = require('../../lib/sql-builder/get-rel-descriptors')
const DescBelongsTo = require('../../lib/sql-builder/desc-belongsto')
const DescHasMany = require('../../lib/sql-builder/desc-hasmany')

test('getBelongsToDescriptors()', (t) => {
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

  const relations = getBelongsToDescriptors(schemaObject)
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
    'returns collection of "belongsTo" descriptors'
  )
  t.end()
})

test('getHasManyDescriptors()', (t) => {
  const schemaObject = {
    users: {
      hasMany: 'user',
      fkField: 'GrpID'
    },
    tables: {
      hasMany: 'restTable',
      fkField: 'UserGroupID'
    },
    group: {
      belongsTo: 'userGroup',
      fkField: 'GrpID'
    },
    rights: {
      belongsTo: 'rights'
      /* fkField: is the same, so we can skip it */
    }
  }

  const relations = getHasManyDescriptors(schemaObject)
  t.equal(relations.length, 2)
  t.deepEqual(
    relations, [
      {
        relationModelName: 'user',
        modelFieldName: 'users',
        fkField: 'GrpID'
      },
      {
        relationModelName: 'restTable',
        modelFieldName: 'tables',
        fkField: 'UserGroupID'
      }
    ],
    'returns collection of "hasMany" descriptors'
  )
  t.end()
})

test('attributesOfRelations()', (t) => {
  const registryMock = {
    model (modelName) {
      const _models = {
        userGroup: { attributesSerialize: ['shortName', 'hide'] },
        rights: { attributesSerialize: ['fullName', 'enabled', 'group'] },
        division: { attributesSerialize: ['name', 'hide', 'staff'] },
        client: { attributesSerialize: ['name', 'hide', 'cardcode', 'manager'] }
      }

      return _models[modelName]
    }
  }

  const belongsToDescriptors = [
    new DescBelongsTo('group', { belongsTo: 'userGroup' }),
    new DescBelongsTo('rights', { belongsTo: 'rights' })
  ]

  const hasManyDescriptors = [
    new DescHasMany('divisions', { hasMany: 'division', fkField: 'UserID' }),
    new DescHasMany('clients', { hasMany: 'client', fkField: 'UserID' })
  ]

  t.deepEqual(
    attributesOfRelations(registryMock, belongsToDescriptors, hasManyDescriptors),
    {
      group: ['shortName', 'hide'],
      rights: ['fullName', 'enabled', 'group'],
      divisions: ['name', 'hide', 'staff'],
      clients: ['name', 'hide', 'cardcode', 'manager']
    },
    'returns attributes of all relations'
  )
  t.end()
})
