module.exports = io => {
  io.on('connect', client => {
    client.emit('news', 'yujie')

  })
}
