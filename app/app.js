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

// global setting

const app = {
  scroll_top: { browse: document.querySelector('#home').clientHeight, home: 0 },
  search_tmpl: document.querySelector('#search script').innerHTML
}
app.scroll_top.search = app.scroll_top.browse + document.querySelector('#browse').clientHeight
Mustache.parse(app.search_tmpl)

document.querySelector('#search tbody').innerHTML = Mustache.render(app.search_tmpl, { db: db })

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
