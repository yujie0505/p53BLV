import gene from './ref/gene.json'

module.exports = io => {
  io.on('connect', client => {
    client.on('get-gene', cb => cb(gene))
  })
}
