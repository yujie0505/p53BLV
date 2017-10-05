'use strict'

// web framework

import 'imports-loader?define=>false,exports=>false,this=>window!mustache/mustache'

import Plotly from 'plotly.js/dist/plotly.min.js'

// custom modules

import './app.sass'
import './index.pug'

// load resource data

import res from './res.json'

///////////////////////////////////////////////////////

// control panel

document.querySelector('#setting').innerHTML = Mustache.render(
  document.querySelector('#setting script').innerHTML,
  { id: Object.keys(res) }
)
