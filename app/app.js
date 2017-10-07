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
  let tids = Object.keys(app.show_tids)

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
      name: 'NM',
      type: 'scatter',
      x: res[tid].plot.x,
      y: res[tid].plot.y
    }

    let trace_5_prime_UTR = {
      hoverinfo: 'none',
      marker: {
        color: 'red',
        width: 1
      },
      name: "5'UTR",
      orientation: 'h',
      outsidetextfont: {
        size: 10
      },
      text: res[tid].sequence_info.coding_region.start,
      textposition: 'outside',
      type: 'bar',
      x: [res[tid].sequence_info.coding_region.start],
      xaxis: 'x2',
      y: ['sequence'],
      yaxis: 'y2'
    }

    let trace_coding_region = {
      hoverinfo: 'none',

      marker: {
        color: 'blue',
        width: 1
      },
      name: "CDS",
      orientation: 'h',
      type: 'bar',
      x: [res[tid].sequence_info.coding_region.end - res[tid].sequence_info.coding_region.start],
      xaxis: 'x2',
      y: ['sequence'],
      yaxis: 'y2'
    }

    let trace_3_prime_UTR = {

      hoverinfo: 'none',

      marker: {
        color: 'yellow',
        width: 1
      },
      name: "3'UTR",
      orientation: 'h',
      type: 'bar',
      x: [res[tid].stats.max_x - res[tid].sequence_info.coding_region.end],
      xaxis: 'x2',
      y: ['sequence'],
      yaxis: 'y2'
    }

    let layout = {
      barmode: 'stack',
      height: 180,
      margin: {
        b: 30,
        t: 30
      },
      title: `[${res[tid].sequence_info.gene_name}] (${tid})`,
      xaxis: {
        range: [1, max_x]
      },
      xaxis2: {
        anchor: 'y2',
        range: [1, max_x],
        scaleanchor: 'x'
      },
      yaxis: {
        domain: [0.3, 1],
        range: [0, max_y]
      },
      yaxis2: {
        domain: [0, 0.1]
      }
    }

    Plotly.newPlot(`plot_${tid}`, [trace_NM, trace_5_prime_UTR, trace_coding_region, trace_3_prime_UTR], layout)
  }
}

// control panel

document.querySelector('#setting').innerHTML = Mustache.render(
  document.querySelector('#setting script').innerHTML,
  { tid: Object.keys(res) }
)

Array.from(document.querySelectorAll('#setting label'), dom => dom.onclick = () => {
  if (app.show_tids[dom.dataset.tid])
    delete app.show_tids[dom.dataset.tid]
  else
    app.show_tids[dom.dataset.tid] = true

  plotResult()
})
