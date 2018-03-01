/* global Modal */

var isomorphicFetch = require('isomorphic-fetch')
var Event = require('crab-event').Event
var SparqlClient = require('sparql-http-client')

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

  var modalHtml = '' +
    '<div id="modal" class="modal fade" tabindex="-1" role="dialog">\n' +
    '  <div class="modal-dialog" role="document">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" aria-label="Close"><span aria-hidden="true" onclick="app.tag.close()">&times;</span></button>\n' +
    '        <h4 class="modal-title">Modal title</h4>\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <p>One fine body&hellip;</p>\n' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <button type="button" class="btn btn-default" onclick="app.tag.close()">Close</button>\n' +
    '        <button type="button" class="btn btn-primary" onclick="app.tag.post()">Save changes</button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>'

  this.modalContainer = document.createElement('div')
  this.modalContainer.innerHTML = modalHtml
  document.body.appendChild(this.modalContainer)

  this.modal = new Modal(document.getElementById('modal'))
  this.modal.show()
}

Tagger.prototype.close = function () {
  var self = this

  this.iri = null

  this.modal.hide()

  setTimeout(function () {
    document.body.removeChild(self.modalContainer)
  }, 1000)
}

Tagger.prototype.post = function () {
  this.close()
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
