import JSONAPISerializer from 'jsonapi-serializer'

export default function userSerialize (user) {
  return new JSONAPISerializer('users', user, {
    attributes: [
      'shortName'
    ],
    keyForAttribute: 'camelCase'
  })
}
