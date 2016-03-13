function DbError (message) {
  this.status = 500
  this.message = message
  this.stack = new Error().stack
  this.code = this.name
}
DbError.prototype = Object.create(Error.prototype)
DbError.prototype.name = 'EDBERROR'

function NotFoundError (message) {
  this.status = 404
  this.message = message
  this.stack = new Error().stack
  this.code = this.name
}
NotFoundError.prototype = Object.create(Error.prototype)
NotFoundError.prototype.name = 'ENOTFOUND'

function BadRequestError (message) {
  this.status = 400
  this.message = message
  this.stack = new Error().stack
  this.code = this.name
}
BadRequestError.prototype = Object.create(Error.prototype)
BadRequestError.prototype.name = 'EBADREQUEST'

function ForbiddenError (message) {
  this.status = 403
  this.message = message
  this.stack = new Error().stack
  this.code = this.name
}
ForbiddenError.prototype = Object.create(Error.prototype)
ForbiddenError.prototype.name = 'EFORBIDDEN'

module.exports = {
  BadRequestError,
  DbError,
  ForbiddenError,
  NotFoundError
}
