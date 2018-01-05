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
  scroll_top: { home: 0, search: document.querySelector('#home').clientHeight },
  search_tmpl: document.querySelector('#search script').innerHTML
}
Mustache.parse(app.search_tmpl)

document.querySelector('#search tbody').innerHTML = Mustache.render(app.search_tmpl, { db: db })

///////////////////////////////////////////////////////////////////////////////////////

// DOM event

/************************************** NAVIGATOR **************************************/

Array.from(document.querySelectorAll('.navigator'), dom => dom.onclick = function () {
  window.scroll({ behavior: 'smooth', top: app.scroll_top[this.dataset.hash] })
})

/************************************** SEARCH **************************************/

Array.from(document.querySelectorAll('#search .ui.checkbox input'), dom => dom.onclick = function () {
  this.parentNode.parentNode.parentNode.querySelector('.list').classList.toggle('disabled')
})

Array.from(document.querySelectorAll('#search .ui.dropdown'), dom => dom.onclick = function () {
  event.stopPropagation()

  let body = document.querySelector('body'),
      last = document.querySelector('#search .ui.dropdown .menu.visible'),
      menu = this.querySelector('.menu')

  menu.classList.toggle('visible')

  if (last) last.classList.remove('visible')

  body.onclick = () => {
    menu.classList.remove('visible')

    body.onclick = null
  }
})

Array.from(document.querySelectorAll('#search .ui.dropdown .menu .item'), dom => dom.onclick = function () {
  this.parentNode.previousSibling.setAttribute('data-list-chosen', this.dataset.list)
})
