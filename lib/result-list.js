var renderer = require('./renderer')
var Event = require('crab-event').Event
var SparqlSearchResultList = require('sparql-search-result-list')

function ResultList (options) {
  this.options = options
  this.isFetching = 0
}

ResultList.prototype.name = 'ResultList'

ResultList.prototype.init = function (app) {
  var self = this

  this.app = app

  this.app.events.resultMetadata = new Event()

  this.resultList = new SparqlSearchResultList({
    endpointUrl: this.app.options.endpointUrl,
    pageSize: this.app.options.resultList.pageSize,
    preload: this.app.options.resultList.preload,
    resultType: this.app.options.resultTypes.slice().shift(),
    scrollArea: 'scrollArea',
    contentArea: 'contentArea',
    dummyResult: '<div class="zack-result"></div>',
    renderResult: renderer.renderResult,
    onResultRendered: renderer.postRender,
    onFetched: this.app.events.fetched.trigger,
    onFetching: this.app.events.fetching.trigger,
    onResultMetadata: this.app.events.resultMetadata.trigger
  })

  // replace default filter query builder methods
  this.resultList.buildMetadataFilterQuery = this.app.queryBuilder.createBuilder(this.app.queryTemplates.count)
  this.resultList.buildResultFilterQuery = this.app.queryBuilder.createBuilder(this.app.queryTemplates.search)

  // connect events
  this.app.events.search.on(function () {
    self.resultList.search(app.searchText)
  })

  this.app.events.fetched.on(function () {
    self.isFetching--
  })

  this.app.events.fetching.on(function () {
    self.isFetching++
  })

  this.app.events.resultMetadata.on(function (metadata) {
    document.getElementById('count').innerHTML = metadata.length
    document.getElementById('scrollArea').scrollTop = 0

    renderer.init(metadata)
  })
}

module.exports = ResultList
