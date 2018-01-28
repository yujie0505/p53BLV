'use strict'

import mongo from './lib/mongo.js'
import track from './lib/track.js'

import { db_info } from './option.json'

const chr_whitelist = new RegExp(`^chr(${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 'X', 'Y', 'MT'].join('|')})$`)

module.exports = io => {
  io.on('connect', client => {
    client.on('plot', async (collection, datasets, target, range, cb) => {
      const plot_data = { gene: [], peak: [], track: {} }

      let chromosome, gene, start_position

      try {
        let [err, result] = await mongo.read('gene', { gene_name: target }, {}, { _id: 0, chr_name: 1, transcription_start_site: 1 })

        if (err)
          throw err

        gene = result.data[0]

      } catch (err) { return cb(err) }

      if (gene) {
        chromosome = `chr${gene.chr_name}`
        start_position = gene.transcription_start_site
      } else {
        let split = target.split(':')

        if (!chr_whitelist.test(split[0]) || !/^\d+$/.test(split[1]))
          return cb(new Error('Wrong Target Format'))

        chromosome = split[0]
        start_position = parseInt(split[1])
      }

      range = parseInt(range)
      start_position = Math.max(1, start_position - parseInt(range / 2))

      try {
        let [err, result] = await mongo.read('gene', {
          chr_name: chromosome.replace(/^chr/, ''),
          transcript_start: { $lte: start_position + range },
          transcript_end: { $gte: start_position }
        }, {}, { _id: 0 })

        if (err)
          throw err

        plot_data.gene = result.data

      } catch (err) { return cb(err) }

      try {
        let [err, result] = await mongo.read('peak', {
          $or: datasets.map(it => { return { dataset: it } }),
          chr_name: chromosome.replace(/^chr/, ''),
          peak_start: { $lte: start_position + range },
          peak_end: { $gte: start_position }
        }, {}, { _id: 0 })

        if (err)
          throw err

        plot_data.peak = result.data

      } catch (err) { return cb(err) }

      if ('homer' !== collection)
        return cb(null, start_position, range, plot_data)

      Promise.all(datasets.reduce((a, b) => a.concat(db_info[b]), []).map(it => {
        return new Promise((resolve, reject) => {
          track.read(it.data_path, chromosome, start_position, range, (err, rlt) => {
            if (err)
              return reject(err)

            if (!plot_data.track[it.title])
              plot_data.track[it.title] = {}

            resolve(plot_data.track[it.title][it.experiment] = rlt)
          })
        })
      })).then(() => cb(null, start_position, range, plot_data)).catch(err => cb(err))
    })

    client.on('search', async (browse, collection, action, datasets, cb) => {
      if ('customized' === browse)
        return cb(null, [])

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
