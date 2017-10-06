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

  let max_x = 0, max_y = 0

  for (let tid of tids) {
    max_x = Math.max(res[tid].stats.max_x, max_x)
    max_y = Math.max(res[tid].stats.max_y, max_y)
  }

  for (let tid of tids) {
    let trace_NM = {
      fill: 'tozeroy',
      fillcolor: '#86d993',
      mode: 'none',
      type: 'scatter',
      x: res[tid].plot.x,
      y: res[tid].plot.y
    }

    let layout = {
      height: 120,
      margin: {
        b: 30,
        t: 30
      },
      title: `[${res[tid].sequence_info.gene_name}] (${tid})`,
      xaxis: {
        range: [1, max_x]
      },
      yaxis: {
        range: [0, max_y]
      }
    }

    Plotly.newPlot(`plot_${tid}`, [trace_NM], layout)
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
