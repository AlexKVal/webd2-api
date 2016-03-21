'use strict'

const Serializer = require('jsonapi-serializer').Serializer
const Deserializer = require('jsonapi-serializer').Deserializer
const getDatabase = require('webd2-db').getDatabase
const {
  DbError,
  NotFoundError
} = require('jsonapi-errors/lib/errors')

const {debugSql} = require('../utils/debug')
const foreignKey = require('../utils/foreign-key')

const database = getDatabase(`DSN=${process.env.D2ALIAS}`)

const fields = ['name', 'password', 'rights']
const fkName = foreignKey('user-group')

/**
 * SQL queries
 */
const sqlAll = `SELECT PersID as id, GrpID as ${fkName},
${fields.join(', ')}
FROM sPersonal
WHERE Hide=False
ORDER BY rights, name`

const sqlOne = function sqlOne (id) {
  return `SELECT PersID as id, GrpID as ${fkName},
    ${fields.join(', ')}
    FROM sPersonal
    WHERE Hide=False AND PersID=${id}`
}

/**
 * Model methods
 */
const model = {
  name: 'user-account',
  fields: fields,

  all () {
    debugSql('user-account:all', sqlAll)

    return database
      .select(sqlAll)
      .catch((errMessage) => {
        throw new DbError(errMessage)
      })
  },

  get (id) {
    const sql = sqlOne(id)
    debugSql(`user-account:get(${id})`, sql)

    return database
      .select(sql)
      .catch((dbErrMessage) => {
        throw new DbError(dbErrMessage)
      })
      .then((rows) => {
        if (rows.length === 0) throw new NotFoundError('db returned an empty result')

        return rows[0]
      })
  }
}

/**
 * serialize / deserialize methods
 */
const deserializer = new Deserializer({
  keyForAttribute: 'camelCase',

  'user-groups': {
    valueForRelationship (rel) {
      return { id: rel.id }
    }
  }
})
const serializer = new Serializer('user-account', { attributes: model.fields + [fkName] })

model.deserialize = function deserialize (dataSet, cb) {
  deserializer.deserialize(dataSet, (err, data) => {
    if (err) return cb(err)

    // jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
    data.userGroup = data['user-group']
    delete data['user-group']
    cb(null, data)
  })
}
model.serialize = serializer.serialize.bind(serializer)

module.exports = model
