'use strict'

const fs = require('fs')

const opt = {
  bytes_per_position : 8,
  data_path          : './ChIP-Seq/homer/HOMER_track_parsed'
}

module.exports = {
  read: (dataset, chromosome, start_position, browsing_range, cb) => {
    const stream = fs.createReadStream(`${opt.data_path}/${chromosome}/${dataset}`, {
      encoding : 'utf-8',
      end      : opt.bytes_per_position * (start_position + browsing_range) - 1,
      start    : opt.bytes_per_position * (start_position - 1)
    })

    let data = []

    stream.on('data', it => data = data.concat(it.match(new RegExp(`.{${opt.bytes_per_position}}`, 'g'))))

    stream.on('end', () => cb(null, data.map(it => parseFloat(it))))

    stream.on('error', err => cb(err))
  }
}
