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

function sqlOne (id) {
  return `SELECT PersID as id, GrpID as ${fkName},
    ${fields.join(', ')}
    FROM sPersonal
    WHERE Hide=False AND PersID=${id}`
}

function sqlIsRowExist (id) {
  return `SELECT PersID as id FROM sPersonal WHERE PersID=${id}`
}

// TODO rights='${data.rights}' => rights='${data.rights.id}'
function sqlUpdate (id, data) {
  return `UPDATE sPersonal
    SET
    name='${data.name}',
    password='${data.password}',
    grpid=${data.userGroup.id},
    rights=${data.rights}
    WHERE PersID=${id}`
}

function sqlMarkDeleted (id) {
  return `UPDATE sPersonal SET hide=true WHERE PersID=${id}`
}

/**
 * Model methods
 */
const Model = {
  name: 'user-account',
  fields: fields,

  all () {
    debugSql('user-account:all', sqlAll)

    return database.exec(sqlAll)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
  },

  get (id) {
    const sql = sqlOne(id)
    debugSql(`user-account:get(${id})`, sql)

    return database.exec(sql)
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError('db returned an empty result')

      return rows[0]
    })
  },

  findByIdAndUpdate (id, data) {
    const sqlUpdating = sqlUpdate(id, data)
    debugSql(`user-account:findByIdAndUpdate(${id})`, sqlUpdating)

    return database.exec(sqlIsRowExist(id))
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError(`row with id: ${id} does not exist`)

      return database.exec(sqlUpdating)
      .catch((dbMsg) => { throw new DbError(dbMsg) })
      .then(() => Model.get(id)) // if OK return new data
    })
  },

  markDeleted (id) {
    const sqlUpdating = sqlMarkDeleted(id)
    debugSql(`user-account:markDeleted(${id})`, sqlUpdating)

    return database.exec(sqlIsRowExist(id))
    .catch((dbMsg) => { throw new DbError(dbMsg) })
    .then((rows) => {
      if (rows.length === 0) throw new NotFoundError(`row with id: ${id} does not exist`)

      return database.exec(sqlUpdating)
      .catch((dbMsg) => { throw new DbError(dbMsg) })
      // if OK return nothing
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
const serializer = new Serializer('user-account', { attributes: Model.fields + [fkName] })

Model.deserialize = function deserialize (dataSet, cb) {
  deserializer.deserialize(dataSet, (err, data) => {
    if (err) return cb(err)

    // jsonapi-serializer@3.0.0 doesn't obey "keyForAttribute: 'camelCase'"
    data.userGroup = data['user-group']
    delete data['user-group']
    cb(null, data)
  })
}
Model.serialize = serializer.serialize.bind(serializer)

module.exports = Model
