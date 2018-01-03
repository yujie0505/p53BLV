'use strict'

// web framework

import 'imports-loader?define=>false,exports=>false,this=>window!mustache/mustache'
import 'semantic-ui-offline/semantic.min.css'

const socket = io()

// custom modules

import './app.sass'
import './index.pug'
import db from './res/dataset.json'

// for hot module replacement in development

if ('development' === process.env.NODE_ENV)
  require('webpack-hot-middleware/client').subscribe(event => {
    if ('hmr' === event.action) window.location.reload()
  })

///////////////////////////////////////////////////////////////////////////////////////

const app = {
  search_tmpl: document.querySelector('#search script').innerHTML
}
Mustache.parse(app.search_tmpl)

document.querySelector('#search tbody').innerHTML = Mustache.render(app.search_tmpl, { db: db })
