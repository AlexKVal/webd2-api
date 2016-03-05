const debugLogger = require('debug')

function debugApi (msg) {
  return debugLogger('webd2-api:api')(msg)
}

function debugSql (msg, sql) {
  const message = msg + ' ' + sql.replace(/\s+/g, ' ').replace(/\n/g, ' ')
  return debugLogger('webd2-api:sql')(message)
}

module.exports = {
  debugApi,
  debugSql
}
