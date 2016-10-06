var Promise = require('bluebird')
var debounce = require('debounce')
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

function search () {
  var query = document.getElementById('query').value

  if (query.trim() !== '') {
    query = query.replace('"', '').trim()
  } else {
    query = '*'
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
  var elements = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'))

  app.filters = elements.filter(function (element) {
    return element.getAttribute('disabled') === null
  }).map(function (element, index) {
    var filter = {}

    filter.operator = element.getAttribute('data-filter')
    filter.predicate = element.getAttribute('data-predicate')
    filter.propertyPathPrefix = element.getAttribute('data-property-path-prefix')
    filter.propertyPathPostfix = element.getAttribute('data-property-path-postfix')
    filter.termType = element.getAttribute('data-named-node') !== null ? 'NamedNode' : 'Literal'
    filter.variable = 'filter' + index

    var eventName = 'onchange'
    var getValue = function (element) {
      var value = element.value || element.getAttribute('data-value')

      if (!value) {
        return null
      }

      if (filter.termType === 'NamedNode') {
        return '<' + value + '>'
      } else {
        return '"' + value + '"' // TODO: escape literal
      }
    }

    if (element.nodeName.toLowerCase() === 'input' && element.type.toLowerCase() === 'date') {
      eventName = 'onblur'

      getValue = function (element) {
        if (element.value) {
          return 'xsd:date(\'' + element.value + '\')'
        } else {
          return null
        }
      }
    }

    filter.value = getValue(element)

    if (eventName) {
      element[eventName] = function (event) {
        filter.value = getValue(element)

        app.events.filterChange.trigger()
      }
    }

    return filter
  })

  app.events.filterChange.trigger()
}

app.removeFilter = function (element) {
  element.parentNode.removeChild(element)
  app.updateFilters()
}

app.containsFilter = function (operator, predicate, value, options) {
  return app.filters.some(function (filter) {
    return filter.operator === operator &&
        filter.predicate === predicate &&
        filter.value === (options.namedNode ? '<' + value + '>' : '"' + value + '"') &&
        filter.termType === (options.namedNode ? 'NamedNode' : 'Literal') &&
        filter.propertyPathPrefix === options.propertyPathPrefix &&
        filter.propertyPathPostfix === options.propertyPathPostfix
  })
}

app.addFilter = function (label, operator, predicate, value, options) {
  if (arguments.length === 1) {
    var element = arguments[0]

    label = element.getAttribute('data-label') || element.textContent
    operator = element.getAttribute('data-filterable')
    predicate = element.getAttribute('data-predicate')
    value = element.value || element.getAttribute('data-value')
    options = {
      namedNode: element.getAttribute('data-named-node') !== null,
      propertyPathPrefix: element.getAttribute('data-property-path-prefix'),
      propertyPathPostfix: element.getAttribute('data-property-path-postfix')
    }

    return app.addFilter(label, operator, predicate, value, options)
  }

  options = options || {}

  if (app.containsFilter(operator, predicate, value, options)) {
    app.events.filterDuplicate.trigger({
      label: label,
      operator: operator,
      predicate: predicate,
      value: value,
      options: options
    })

    return
  }

  var html = '<div data-filter="' + operator + '" ' +
    'data-predicate="' + predicate + '" ' +
    (options.propertyPathPrefix ? 'data-property-path-prefix="' + options.propertyPathPrefix + '" ' : '') +
    (options.propertyPathPostfix ? 'data-property-path-postfix="' + options.propertyPathPostfix + '" ' : '') +
    'data-value="' + value + '" ' +
    (options.namedNode ? 'data-named-node ' : '') +
    'class="filter-item" onclick="app.removeFilter(this)">' + label + '</div>'

  document.getElementById(app.options.filterContainer).innerHTML += html

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
    histogram: require('../.build/zack-histogram-sparql')
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
