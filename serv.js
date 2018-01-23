import mongo from './lib/mongo.js'

module.exports = io => {
  io.on('connect', client => {
    client.on('search', async (browse, collection, action, datasets, cb) => {
      if ('customized' === browse)
        return cb()

      let project = { _id: 0, gene_name: 1 }, query = []

      for (let dataset of datasets) {
        project[dataset] = 1
        query.push({ [dataset]: true })
      }

      try {
        let [err, result] = await mongo.read(collection, { ['union' === action ? '$or' : '$and']: query }, {}, project)

        if (err)
          throw err

        cb(null, result.data)

      } catch (err) { cb(err) }
    })
  })
}
