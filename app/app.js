'use strict'

// web framework

import 'imports-loader?define=>false,exports=>false,this=>window!mustache/mustache'
import 'semantic-ui-offline/semantic.min.css'

const socket = io()

// custom modules

import './app.sass'
import './index.pug'
import db from './res/dataset.json'
import gene_ref from './res/gene-ref.json'

// for hot module replacement in development

if ('development' === process.env.NODE_ENV)
  require('webpack-hot-middleware/client').subscribe(event => {
    if ('hmr' === event.action) window.location.reload()
  })

///////////////////////////////////////////////////////////////////////////////////////

// global setting

const app = {
  redirection_list: {
    FAM95C : 'http://asia.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=ENSG00000283486;r=9:38540569-38577207',
    OR8S1  : 'http://asia.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=ENSG00000284723;r=12:48525632-48528103'
  },
  result_table_status: {
    curr_page_number : 1,
    items_per_page   : 10
  },
  result_tbody_tmpl: document.querySelector('#result tbody script').innerHTML,
  result_thead_tmpl: document.querySelector('#result thead script').innerHTML,
  scroll_top: { browse: document.querySelector('#home').clientHeight, home: 0 },
  search_tmpl: document.querySelector('#search script').innerHTML,
  wildtype_datasets: /^D(1|2|3|4|5|6|7|8|9)$/
}
app.scroll_top.search = app.scroll_top.browse + document.querySelector('#browse').clientHeight
Mustache.parse(app.result_tbody_tmpl)
Mustache.parse(app.result_thead_tmpl)
Mustache.parse(app.search_tmpl)

document.querySelector('#search tbody').innerHTML = Mustache.render(app.search_tmpl, { db: db })

const renderTbody = (datasets, gene_list) => {
  document.querySelector('#result tbody').innerHTML = Mustache.render(app.result_tbody_tmpl, { gene_list: gene_list.map(it => {
    let ref = gene_ref[it.gene_name]

    it.datasets = datasets.map(dataset => it[dataset] ? '<i class="large green checkmark icon"></i>' : '')
    it.reference = app.redirection_list[it.gene_name] || `http://asia.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${ref[0]};r=${ref[1]}:${ref[2]}-${ref[3]};t=${ref[4]}`

    return it

  }) })
}

///////////////////////////////////////////////////////////////////////////////////////

// DOM event

/************************************** NAVIGATOR **************************************/

Array.from(document.querySelectorAll('.navigator'), dom => dom.onclick = function () {
  window.scroll({ behavior: 'smooth', top: app.scroll_top[this.dataset.hash] })
})

/************************************** BROWSE **************************************/

Array.from(document.querySelectorAll('#browse .column[data-browse]'), dom => dom.onclick = function () {
  document.querySelector('#browse .column[data-browse].chosen').classList.remove('chosen')

  this.classList.add('chosen')
})

/************************************** SEARCH **************************************/

document.querySelector('#search thead .dropdown').onclick = function () {
  event.stopPropagation()

  let body = document.querySelector('body'),
      menu = this.querySelector('.menu')

  menu.classList.toggle('visible')

  body.onclick = () => {
    menu.classList.remove('visible')

    body.onclick = null
  }
}

Array.from(document.querySelectorAll('#search thead .dropdown .menu .item'), dom => dom.onclick = function () {
  let list = this.dataset.list

  this.parentNode.setAttribute('data-list-chosen', list)

  Array.from(document.querySelectorAll('#search tbody td.list'), dom => dom.textContent = list)
})

Array.from(document.querySelectorAll('#search tbody .checkbox input'), dom => dom.onclick = function () {
  this.parentNode.parentNode.parentNode.querySelector('td.list').classList.toggle('disabled')
})

document.querySelector('#search button').onclick = () => {
  let browse = document.querySelector('#browse .column[data-browse].chosen').dataset.browse,
      collection = document.querySelector('#search thead .dropdown .menu').dataset.listChosen,
      datasets_chosen = document.querySelectorAll('#search tbody .checkbox input:checked')

  if (!datasets_chosen.length) return

  const datasets = []

  Array.from(datasets_chosen, dom => datasets.push(dom.dataset.dataset))

  socket.emit('search', browse, collection.toLowerCase(), 'union', datasets, (err, gene_list) => {
    Array.from(datasets_chosen, dom => {
      dom.checked = false
      dom.parentNode.parentNode.parentNode.querySelector('td.list').classList.toggle('disabled')
    })

    if (err) return console.error(err)

    /********** THEAD **********/

    let thead = { datasets: datasets, mutant: 0, wildtype: 0 }

    for (let dataset of datasets)
      thead[app.wildtype_datasets.test(dataset) ? 'wildtype' : 'mutant']++

    document.querySelector('#result thead').innerHTML = Mustache.render(app.result_thead_tmpl, thead)

    document.querySelector('#result th[data-sort-by-occurrence]').onclick = () => {
      gene_list.sort((a, b) => b.occurrence - a.occurrence)

      renderTbody(datasets, gene_list.slice(app.result_table_status.items_per_page * (app.result_table_status.curr_page_number - 1), app.result_table_status.items_per_page * app.result_table_status.curr_page_number))
    }

    /********** TBODY **********/

    for (let gene of gene_list) {
      gene.occurrence = 0

      datasets.forEach(dataset => { if (gene[dataset]) gene.occurrence++ })
    }

    renderTbody(datasets, gene_list.slice(app.result_table_status.items_per_page * (app.result_table_status.curr_page_number - 1), app.result_table_status.items_per_page * app.result_table_status.curr_page_number))

    Array.from(document.querySelectorAll('#result th[data-dataset]'), dom => dom.onclick = function () {
      let exile = [], owned = []

      for (let gene of gene_list) {
        if (gene[this.dataset.dataset]) owned.push(gene)
        else                            exile.push(gene)
      }

      gene_list = owned.slice().concat(exile)
      renderTbody(datasets, gene_list.slice(app.result_table_status.items_per_page * (app.result_table_status.curr_page_number - 1), app.result_table_status.items_per_page * app.result_table_status.curr_page_number))
    })

    document.querySelector('#result').style.display = 'block'
    window.scroll({ behavior: 'smooth', top: app.scroll_top.search + document.querySelector('#search').clientHeight })
  })
}
