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

const app = {
  result_tmpl: document.querySelector('#results script').innerHTML,
  show_tids: {}
}
Mustache.parse(app.result_tmpl)

const plotResult = () => {
  let tids = Object.keys(app.show_tids).filter(tid => app.show_tids[tid])

  // plot results

  document.querySelector('#results').innerHTML = Mustache.render(app.result_tmpl, { tid: tids })

  for (let tid of tids) {
    Plotly.newPlot(
      `plot_${tid}`,
      [{
        fill: 'tozeroy',
        mode: 'none',
        type: 'scatter',
        x: res[tid].plot.x,
        y: res[tid].plot.y
      }],
      {
        title: `[${res[tid].sequence_info.gene_name}] (${tid})`
      }
    )
  }
}

// control panel

document.querySelector('#setting').innerHTML = Mustache.render(
  document.querySelector('#setting script').innerHTML,
  { tid: Object.keys(res) }
)

Array.from(document.querySelectorAll('#setting label'), dom => dom.onclick = () => {
  app.show_tids[dom.dataset.tid] = app.show_tids[dom.dataset.tid] ? app.show_tids[dom.dataset.tid] ^ 1 : 1

  plotResult()
})
