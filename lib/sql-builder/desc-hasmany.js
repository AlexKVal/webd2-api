'use strict'

class DescHasMany {
  constructor (modelFieldName, descriptorObject) {
    if (modelFieldName == null) throw new TypeError('modelNameField attribute is undefined')
    if (descriptorObject == null) throw new TypeError('descriptorObject attribute is undefined')
    if (descriptorObject.hasMany == null) throw new TypeError('hasMany field is undefined')
    if (descriptorObject.fkField == null) throw new TypeError('fkField field is undefined')

    this.modelFieldName = modelFieldName

    this.relationModelName = descriptorObject.hasMany
    this.fkField = descriptorObject.fkField
  }
}

module.exports = DescHasMany
