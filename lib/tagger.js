/* global Modal, fetch */

var isomorphicFetch = require('isomorphic-fetch')
var Event = require('crab-event').Event
var SparqlClient = require('sparql-http-client')
var $ = require('jquery')

function Tagger (options) {
  this.endpointUrl = options.endpointUrl
}

Tagger.prototype.name = 'Tagger'

Tagger.prototype.init = function (app) {
  this.app = app
  this.app.tag = this
  this.app.events.tag = new Event()

  this.endpointUrl = this.endpointUrl || this.app.options.endpointUrl

  this.client = new SparqlClient({
    fetch: isomorphicFetch,
    endpointUrl: this.endpointUrl,
    updateUrl: this.endpointUrl
  })
}

Tagger.prototype.create = function (iri) {
  this.iri = (iri && iri.getAttribute && iri.getAttribute('data-iri')) || iri
  this.title = (iri && iri.getAttribute && iri.getAttribute('data-title')) || iri

  var modalHtml = '' +
    '<div id="modal" class="modal fade" tabindex="-1" role="dialog">\n' +
    '  <div class="modal-dialog" role="document">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" aria-label="Close"><span aria-hidden="true" onclick="app.tag.close()">&times;</span></button>\n' +
    '        <h3 class="modal-title">Add a Tag</h>\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <div>Resource: <i>' + this.title + '</i></div>\n' +
    '        <input id="tags-typeahead" class="typeahead" type="text" placeholder="HLS Concepts" style="width: 100%">\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <iframe id="iframe" style="border: none; width: 100%; height: 400px"></iframe>' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <button type="button" class="btn btn-default" onclick="app.tag.close()">Close</button>\n' +
    '        <button type="button" class="btn btn-primary" onclick="app.tag.post()">Add Tag</button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>'

  this.modalContainer = document.createElement('div')
  this.modalContainer.innerHTML = modalHtml
  document.body.appendChild(this.modalContainer)

  var self = this
  function source (search, sync, cb) {
    self.app.tag.search(search.toLowerCase()).then(function (result) { cb(result) }).catch(cb)
  }

  $('#tags-typeahead').typeahead({
    hint: true,
    highlight: false,
    delay: 500,
    minLength: 3
  },
    {
      name: 'tags',
      limit: 8,
      display: function (item) { return item.label.value },
      templates: {
        notFound: [
          '<h5 class="text-center">No entries found...</h5>'
        ],
        pending: [
          '<h5 class="text-center"><i class="fa fa-spinner fa-spin fa-fw"></i><em> Looking for entries ...</em></h5>'
        ],
        suggestion: function (item) {
          return '<li><div><b>' + item.label.value + '</b><br>' + item.description.value + '</div></li>'
        }
      },
      source: source
    })

  $('#tags-typeahead').bind('typeahead:select', function (ev, suggestion) {
    self.app.tag.selected = suggestion
    $('#iframe').attr('src', 'http://www.hls-dhs-dss.ch/textes/d/D' + suggestion.hls.value + '.php')
  })

  this.modal = new Modal(document.getElementById('modal'))

  $('.modal').on('shown.bs.modal', function () {
    $(this).find('input:visible:first').focus()
  })

  this.modal.show()
}

Tagger.prototype.close = function () {
  var self = this

  this.iri = null
  this.selected = null

  this.modal.hide()

  setTimeout(function () {
    document.body.removeChild(self.modalContainer)
  }, 1000)
}

Tagger.prototype.post = function () {
  if (!this.iri || !this.selected) {
    return
  }

  var self = this

  var json = {
    '@context': {
      CrowdTag: 'http://data.alod.ch/alod/CrowdTag',
      concept: {
        '@id': 'http://data.alod.ch/alod/concept',
        '@type': '@id'
      },
      hlsId: 'http://data.alod.ch/alod/hlsId',
      label: 'http://www.w3.org/2000/01/rdf-schema#label',
      taggedResource: {
        '@id': 'http://data.alod.ch/alod/taggedResource',
        '@type': '@id'
      }
    },
    '@type': 'CrowdTag',
    taggedResource: this.iri,
    concept: this.selected.concept.value,
    label: this.selected.label.value,
    hlsId: this.selected.hls.value
  }

  fetch('/api/tags/', {
    method: 'post',
    headers: {
      'content-type': 'application/ld+json'
    },
    body: JSON.stringify(json)
  }).then(function () {
    self.close()
  }).catch(function (err) {
    console.error(err)
    self.close()
  })
}

Tagger.prototype.search = function (search) {
  var queryTemplate = this.app.getQuery(this.endpointUrl, 'tagSearch')

  var query = queryTemplate
    .split('${language}').join('de') // eslint-disable-line no-template-curly-in-string
    .split('${search}').join(search.toLowerCase()) // eslint-disable-line no-template-curly-in-string

  return this.client.selectQuery(query).then(function (res) {
    return res.json()
  }).then(function (result) {
    return result.results.bindings
  })
}

module.exports = Tagger
