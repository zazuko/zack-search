var Promise = require('bluebird')
var debounce = require('debounce')
var filter = require('./filter')
var renderer = require('./renderer')
var Event = require('crab-event').Event
var Histogram = require('./histogram')
var QueryBuilder = require('./query-builder')
var Timeline = require('./timeline')
var SparqlSearchResultList = require('sparql-search-result-list')

var app = {}

app.options = require('./config')

window.app = app

window.onresize = function () {
  app.events.resize.trigger()
}

app.events = {
  fetched: new Event(),
  fetching: new Event(),
  filterChange: new Event(),
  filterDuplicate: new Event(),
  resize: new Event(),
  resultMetadata: new Event(),
  search: new Event()
}

app.isFetching = 0
app.renderHistogram = false

app.filters = []
app.staticFilters = []

function search () {
  var query = document.getElementById('query').value

  if (query.trim() !== '') {
    query = query.replace('"', '').trim()
  } else {
    query = null
  }

  // only use the textmatch SPARQL part if query is not empty

  if (query) {
    app.queryBuilder.setParts({
      'textmatch': app.queryTemplates.textmatch
    })
  } else {
    app.queryBuilder.setParts({
      'textmatch': app.queryTemplates.textmatchDummy
    })
  }

  app.resultList.search(query)
}

function resultMetadata (metadata) {
  document.getElementById('count').innerHTML = metadata.length
  document.getElementById('scrollArea').scrollTop = 0
}

function updateTimeline () {
  app.timeline.render(app.resultList.start, app.resultList.end)
  app.histogram.clear()
}

function updateHistogram () {
  app.histogram.render(app.resultList.query)
  app.renderHistogram = false
}

app.updateFilters = function () {
  var htmlFilters = filter.fromElements(document.querySelectorAll('[data-filter]'), app.events.filterChange.trigger)

  // build filter list from HTML elements and static filters
  app.filters = htmlFilters.concat(app.staticFilters)

  app.events.filterChange.trigger()
}

app.removeFilter = function (element) {
  element.parentNode.removeChild(element)

  app.updateFilters()
}

app.containsFilter = function (other) {
  return app.filters.some(function (existing) {
    return filter.compare(existing, other)
  })
}

app.addFilter = function (label, operator, predicate, value, options) {
  var instance

  if (arguments.length === 1) {
    var element = label

    label = element.getAttribute('data-label') || element.textContent
    instance = filter.fromElement(element)
  } else {
    instance = filter(operator, predicate, value, options)
  }

  if (app.containsFilter(instance)) {
    app.events.filterDuplicate.trigger({
      label: label,
      filter: instance
    })

    return
  }

  document.getElementById(app.options.filterContainer).appendChild(filter.toElement(label, instance, app))

  app.updateFilters()
}

function initUi () {
  // renderer
  app.renderer = renderer
  app.events.resultMetadata.on(app.renderer.init)

  // timeline
  app.timeline = new Timeline({margin: {top: 40, right: 20, bottom: 0, left: 20}})

  app.events.resize.on(updateTimeline)
  app.events.resultMetadata.on(updateTimeline)

  // histogram
  app.histogram = new Histogram({
    endpointUrl: app.options.endpointUrl,
    margin: {top: 0, right: 20, bottom: 0, left: 20}
  })

  app.histogram.buildQuery = app.queryBuilder.createBuilder(app.queryTemplates.histogram)

  app.events.resultMetadata.on(function () {
    app.renderHistogram = true
  })

  app.events.fetched.on(function () {
    setTimeout(function () {
      if (app.renderHistogram && !app.isFetching) {
        updateHistogram()
      }
    }, 1)
  })

  app.events.resize.on(debounce(updateHistogram, 500))

  // query field
  document.getElementById('query').onkeyup = debounce(function () {
    app.events.search.trigger()
  }, 250)

  app.updateFilters()

  app.events.search.trigger()
}

function initQueryBuilder () {
  app.queryBuilder = new QueryBuilder()

  app.queryTemplates = {
    search: require('../.build/zack-sparql'),
    count: require('../.build/zack-count-sparql'),
    histogram: require('../.build/zack-histogram-sparql'),
    textmatch: require('../.build/zack-textmatch-part-sparql'),
    textmatchDummy: require('../.build/zack-textmatch-dummy-part-sparql')
  }

  if (app.options.resultTypes) {
    app.options.resultTypes.forEach(function (resultType) {
      app.staticFilters.push({
        operator: '=',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        termType: 'NamedNode',
        variable: 'resultType',
        value: '<' + resultType + '>'
      })
    })
  }

  return Promise.resolve()
}

function initResultList () {
  app.resultList = new SparqlSearchResultList({
    endpointUrl: app.options.endpointUrl,
    pageSize: app.options.pageSize,
    preload: app.options.preload,
    resultType: 'http://data.archiveshub.ac.uk/def/ArchivalResource',
    scrollArea: 'scrollArea',
    contentArea: 'contentArea',
    dummyResult: '<div class="zack-result"></div>',
    renderResult: renderer.renderResult,
    onResultRendered: renderer.postRender,
    onFetched: app.events.fetched.trigger,
    onFetching: app.events.fetching.trigger,
    onResultMetadata: app.events.resultMetadata.trigger
  })

  // replace default filter query builder methods
  app.resultList.buildMetadataFilterQuery = app.queryBuilder.createBuilder(app.queryTemplates.count)
  app.resultList.buildResultFilterQuery = app.queryBuilder.createBuilder(app.queryTemplates.search)

  // connect events

  app.events.fetched.on(function () {
//    console.log('fetched')
    app.isFetching--
  })

  app.events.fetching.on(function () {
//    console.log('fetching')
    app.isFetching++
  })

  app.events.filterChange.on(function () {
    app.queryBuilder.setFilters(app.filters)
    app.events.search.trigger()
  })

  app.events.resultMetadata.on(resultMetadata)

  app.events.search.on(search)
}

initQueryBuilder().then(function () {
  return initResultList()
}).then(function () {
  return initUi()
})
