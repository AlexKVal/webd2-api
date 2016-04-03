'use strict'

function generateUpdateSetPart (data, schema) {
  return Object.keys(schema).reduce((linesArray, fieldName) => {
    const fieldType = schema[fieldName]
    let fieldData
    switch (fieldType) {
      case 'string':
        const value = data[fieldName] == null ? '' : data[fieldName]
        fieldData = "'" + String(value).replace(/'/g, ' ') + "'"
        break
      default: // 'number', 'boolean' as is
        fieldData = data[fieldName]
    }

    linesArray.push(`${fieldName}=${fieldData}`)
    return linesArray
  }, [])
}

module.exports = {
  generateUpdateSetPart
}
