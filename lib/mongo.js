'use strict'

const client = require('mongodb').MongoClient,
      option = require('../option.json').mongodb

const _connect = async () => {
  return await client.connect(`mongodb://${option.username}:${option.password}@localhost:27017/?authMechanism=${option.auth_mechanism}&authSource=${option.database}`)
}

module.exports = {
  insert: async (collection_name, data) => {
    try {
      const _database = await _connect()

      await _database.db(option.database).collection(collection_name).insertMany(data)

      _database.close()
    } catch (err) { return err }
  },
  read: async (collection_name, query={}, hint={}, project={}, log=false) => {
    try {
      const _database = await _connect()
      const result = { data: await _database.db(option.database).collection(collection_name).find(query).hint(hint).project(project).toArray() }

      if (log)
        result.log = await _database.db(option.database).collection(collection_name).find(query).hint(hint).project(project).explain()

      _database.close()

      return [null, result]
    } catch (err) { return [err] }
  },
  setIndex: async (collection_name, indexes) => {
    try {
      const _database = await _connect()

      await _database.db(option.database).collection(collection_name).createIndex(indexes)

      _database.close()
    } catch (err) { return err }
  }
}
