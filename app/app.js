const socket = io()

import './app.sass'
import './index.pug'

if ('development' === process.env.NODE_ENV) {
  require('webpack-hot-middleware/client').subscribe(event => {
    if ('hmr' === event.action) window.location.reload()
  })
}

socket.on('news', it => console.log(it))
