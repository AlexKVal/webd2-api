'use strict'
const test = require('tape')

const BaseModel = require('../../lib/models/base-model')

const dbMock = {
  exec () {
    return Promise.resolve()
  }
}
class SomeModel extends BaseModel {}

test('BaseModel is abstract class', function (t) {
  const fn1 = function fn1 () {
    return new BaseModel(dbMock, 'name')
  }
  t.throws(fn1, /is abstract class/)

  const fn2 = function fn2 () {
    return new SomeModel(dbMock, 'name')
  }
  t.doesNotThrow(fn2, /is abstract class/)

  t.end()
})

test('BaseModel needs database layer', function (t) {
  const fn = function fn () {
    return new SomeModel()
  }
  t.throws(fn, /database is undefined/, 'throws when no "database" provided')
  t.end()
})

test('BaseModel constructor gets name and optionally schema', function (t) {
  const fn = function fn () {
    return new SomeModel(dbMock)
  }
  t.throws(fn, /name is undefined/, 'throws when no "name" provided')
  t.end()
})

test('BaseModel if schema is not provided, then default one is created', function (t) {
  const model = new SomeModel(dbMock, 'some-name')

  t.equal(model.name, 'some-name')
  t.ok((model.schema instanceof Object))
  t.end()
})

test('BaseModel throws if "schema" is not an object', function (t) {
  const fn0 = function fn0 () {
    return new SomeModel(dbMock, 'name', 'any non object')
  }
  t.throws(fn0, /schema attribute should be an object/, 'throws with not an object')

  const fn1 = function fn1 () {
    return new SomeModel(dbMock, 'name', {})
  }
  t.doesNotThrow(fn1, /schema attribute should be an object/, 'does not throw with object')

  t.end()
})

/**
 * #all
 */
class ModelForAll extends BaseModel {
  sqlAll () {}
}

test('BaseModel#all returns a Promise', function (t) {
  const model = new ModelForAll(dbMock, 'name', {})

  t.ok(model.all() instanceof Promise)
  t.end()
})

test('BaseModel#all calls db#exec', function (t) {
  t.plan(1)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.resolve()
    }
  }
  const model = new ModelForAll(db, 'name', {})

  model.all()
  t.end()
})

test('BaseModel#all catches db-layer error message and returns it as Error object', function (t) {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.reject('db error message')
    }
  }

  const model = new ModelForAll(db, 'name', {})
  model.all()
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db error message/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#all throws error if sqlAll is not overridden', function (t) {
  class ModelAllThrows extends BaseModel {
    // sqlAll () {} is not overridden
  }
  const model = new ModelAllThrows(dbMock, 'name', {})
  t.throws(() => model.all(), /you should override sqlAll/)
  t.end()
})

test('BaseModel#all sends generated sql-query to db layer', function (t) {
  t.plan(1)

  const db = {
    exec (sql) {
      t.equal(sql, 'SELECT * FROM table')
      return Promise.resolve()
    }
  }

  class AModel extends BaseModel {
    sqlAll () { return 'SELECT * FROM table' }
  }

  const model = new AModel(db, 'name', {})
  model.all()
  t.end()
})

/**
 * #get(id)
 */
class ModelForGet extends BaseModel {
  sqlOne () {}
}

test('BaseModel#get returns a Promise', function (t) {
  const model = new ModelForGet(dbMock, 'name', {})

  t.ok(model.get(1) instanceof Promise)
  t.end()
})

test('BaseModel#get calls db#exec', function (t) {
  t.plan(1)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.resolve()
    }
  }
  const model = new ModelForGet(db, 'name', {})

  model.get(1)
  t.end()
})

test('BaseModel#get catches db-layer error message and returns it as Error object', function (t) {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.reject('db error message get')
    }
  }

  const model = new ModelForGet(db, 'name', {})
  model.get(1)
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db error message get/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#get throws error if sqlOne is not overridden', function (t) {
  class ModelGetThrows extends BaseModel {
    // sqlOne () {} is not overridden
  }
  const model = new ModelGetThrows(dbMock, 'name', {})
  t.throws(() => model.get(1), /you should override sqlOne/)
  t.end()
})

test('BaseModel#get sends generated sql-query to db layer', function (t) {
  t.plan(1)

  const db = {
    exec (sql) {
      t.equal(sql, 'SELECT * FROM tableGet')
      return Promise.resolve()
    }
  }

  class AGetModel extends BaseModel {
    sqlOne () { return 'SELECT * FROM tableGet' }
  }

  const model = new AGetModel(db, 'name', {})
  model.get(1)
  t.end()
})

test('BaseModel#get throws error if no "id" provided', function (t) {
  class ModelForGetIdThrows extends BaseModel {
    // sqlOne () {} is not overridden
  }
  const model = new ModelForGetIdThrows(dbMock, 'name', {})
  t.throws(() => model.get(/* no id */), /no id has been provided/)
  t.end()
})

test('BaseModel#get rejects with error if db returns no rows', function (t) {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.resolve([/* no rows */])
    }
  }

  const model = new ModelForGet(db, 'name', {})
  model.get(1)
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db returned no data/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#get returns row if got one off db', function (t) {
  t.plan(3)

  const db = {}
  db.exec = () => Promise.resolve([{someData: 'some value'}])

  const model = new ModelForGet(db, 'name', {})
  model.get(1)
  .then((row) => {
    t.pass('get(id) resolves')
    t.assert(row, 'some data has been returned')
    t.equal(row.someData, 'some value')
    t.end()
  })
})

/**
 * #update(id, data)
 */
class ModelForUpdate extends BaseModel {
  sqlUpdate () {}
  sqlIsRowExist () {}
}

test('BaseModel#update returns a Promise', function (t) {
  const model = new ModelForUpdate(dbMock, 'name', {})

  t.ok(model.update(1, {name: 'new'}) instanceof Promise)
  t.end()
})

test('BaseModel#update catches db-layer error message and returns it as Error object', function (t) {
  t.plan(3)

  const db = {
    exec () {
      t.pass('db#exec call')
      return Promise.reject('db error message update')
    }
  }

  const model = new ModelForUpdate(db, 'name', {})
  model.update(1, {name: 'new'})
  .catch((e) => {
    t.pass('catch db error')
    t.assert(/db error message update/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#update throws error if sqlIsRowExist is not overridden', function (t) {
  class ModelUpdateThrows extends BaseModel {
    // sqlIsRowExist () {} is not overridden
    sqlUpdate () {}
  }
  const model = new ModelUpdateThrows(dbMock, 'name', {})
  t.throws(() => model.update(1, {name: 'new'}), /you should override sqlIsRowExist/)
  t.end()
})

test('BaseModel#update sends generated sql-query to db layer', function (t) {
  t.plan(2) // two db.exec() calls

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.equal(sql, 'SELECT id FROM tableUpdate WHERE id=1', '1st query is sqlIsRowExist')
        this.sqlQueryCounter += 1
        return Promise.resolve([{some: 'row'}])
      } else if (this.sqlQueryCounter === 1) {
        t.equal(sql, 'SELECT * FROM tableUpdate', '2nd query is sqlUpdate')
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else {
        t.fail('more than two db.exec() calls')
      }
    }
  }

  class AnUpdateModel extends BaseModel {
    sqlIsRowExist (id) { return `SELECT id FROM tableUpdate WHERE id=${id}` }
    sqlUpdate () { return 'SELECT * FROM tableUpdate' }
  }

  const model = new AnUpdateModel(db, 'name', {})
  model.update(1, {name: 'new'})
  .then(() => t.end())
})

test('BaseModel#update throws error if no "id" or "data" provided', function (t) {
  const model = new ModelForUpdate(dbMock, 'name', {})
  t.throws(() => model.update(/* no id */), /no id has been provided/)
  t.throws(() => model.update(1 /* no data */), /no data has been provided/)
  t.end()
})

test('BaseModel#update throws error if no "id" or "data" provided', function (t) {
  const model = new ModelForUpdate(dbMock, 'name', {})
  t.throws(() => model.update(/* no id */), /no id has been provided/)
  t.throws(() => model.update(1 /* no data */), /no data has been provided/)
  t.end()
})

test('BaseModel#update rejects with error if no row with "id" exists', function (t) {
  t.plan(3)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.pass('1st query is sqlIsRowExist')
        this.sqlQueryCounter += 1
        return Promise.resolve([/* no row with id has been found */])
      } else if (this.sqlQueryCounter === 1) {
        t.fail('if row with "id" not found it should not call sqlUpdate')
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  const model = new ModelForUpdate(db, 'name', {})
  model.update(1, {name: 'new'})
  .catch((e) => {
    t.pass('catch error')
    t.assert(/row with id: 1 does not exist/.test(e.message), 'assert error message')
    t.end()
  })
})

test('BaseModel#update returns an updated model', function (t) {
  t.plan(4)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.pass('1st query is sqlIsRowExist')
        this.sqlQueryCounter += 1
        return Promise.resolve([{some: 'data exists'}])
      } else if (this.sqlQueryCounter === 1) {
        t.pass('2nd sqlUpdate')
        this.sqlQueryCounter += 1
        return Promise.resolve() // successful update
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullUpdate extends BaseModel {
    sqlIsRowExist (id) {}
    sqlUpdate () {}

    get () {
      // overriden for the test
      t.pass('get(id) has been called')
      return Promise.resolve({some: 'updated data'})
    }
  }
  const model = new ModelForFullUpdate(db, 'name', {})
  model.update(1, {name: 'new'})
  .then((row) => {
    t.equal(row.some, 'updated data', 'updated model has been returned')
    t.end()
  })
})

/**
 * #create(data)
 */
//
test('BaseModel#create returns saved model', function (t) {
  t.plan(3)

  const db = {
    sqlQueryCounter: 0,
    exec (sql) {
      if (this.sqlQueryCounter === 0) {
        t.pass('1st query is sqlCreate') // successful insert
        this.sqlQueryCounter += 1
        return Promise.resolve()
      } else if (this.sqlQueryCounter === 1) {
        t.pass('2nd sqlGet')
        this.sqlQueryCounter += 1
        return Promise.resolve([{saved: 'new data'}])
      } else {
        t.fail('more db.exec() calls')
      }
    }
  }

  class ModelForFullCreate extends BaseModel {
    sqlCreate () {}
    sqlDataWithID () {}
  }
  const model = new ModelForFullCreate(db, 'name', {})
  model.create({name: 'new'})
  .then((row) => {
    t.equal(row.saved, 'new data', 'saved model has been returned')
    t.end()
  })
})

/**
 * Serializer
 */
test('BaseModel#serialize(records) throws if "records" is undefined', function (t) {
  const model = new SomeModel(dbMock, 'name')
  const fn1 = function fn1 () {
    model.serialize(undefined)
  }
  t.throws(fn1, /records cannot be undefined/)

  const fn2 = function fn2 () {
    model.serialize([])
  }
  t.doesNotThrow(fn2, /records cannot be undefined/)

  t.end()
})

test('BaseModel#serialize takes into account "belongsTo" relations', function (t) {
  const model = new SomeModel(dbMock, 'user', {
    name: 'string',
    group: {
      belongsTo: 'user-group',
      fkField: 'GrpID'
    }
  })

  const serializedModel = model.serialize([
    {id: 1, name: 'Admin', userGroupId: 1}
  ])

  t.deepEqual(serializedModel, {
    data: [ { attributes: { name: 'Admin', 'user-group-id': 1 }, id: '1', type: 'users' } ]
  })

  t.end()
})
