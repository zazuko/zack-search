var Promise = require('bluebird')
var debounce = require('debounce')
var filter = require('./filter')
var Event = require('crab-event').Event
var Histogram = require('./histogram')
var QueryBuilder = require('./query-builder')
var ResultList = require('./result-list')
var Timeline = require('./timeline')

var app = {}

app.options = require('./config')

app.options.queries = {
  fusekiSearch: require('../.build/zack-sparql'),
  fusekiCount: require('../.build/zack-count-sparql'),
  fusekiHistogram: require('../.build/zack-histogram-sparql'),
  fusekiTextmatch: require('../.build/zack-textmatch-part-sparql')
}

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
  search: new Event()
}

app.plugins = [
  new ResultList()
]

app.plugins.find = function (name) {
  return app.plugins.filter(function (plugin) {
    return plugin.name === name
  }).shift()
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
  app.queryBuilder.setParts({
    'textmatch': query ? app.queryTemplates.textmatch : ''
  })

  app.searchText = query
}

function updateTimeline () {
  var resultList = app.plugins.find('ResultList')

  if (resultList) {
    app.timeline.render(resultList.resultList.start, resultList.resultList.end)
  }

  app.histogram.clear()
}

function updateHistogram () {
  app.histogram.render(app.searchText)
  app.renderHistogram = false
}

app.getQuery = function (endpointUrl, id) {
  return app.options.queries[app.options.endpoints[endpointUrl].queries[id]]
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
  // init plugins
  Promise.all(app.plugins.map(function (plugin) {
    return plugin.init(app)
  }))

  // timeline
  app.timeline = new Timeline({margin: {top: 40, right: 20, bottom: 0, left: 20}})

  app.events.resize.on(updateTimeline)
  app.events.resultMetadata.on(updateTimeline)

  // histogram
  app.histogram = new Histogram({
    endpointUrl: app.options.endpointUrl,
    margin: {top: 0, right: 20, bottom: 0, left: 20}
  })

  app.histogram.buildQuery = app.queryBuilder.createBuilder(app.getQuery(app.options.endpointUrl, 'histogram'))

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

function initFilters () {
  app.events.filterChange.on(function () {
    app.queryBuilder.setFilters(app.filters)
    app.events.search.trigger()
  })

  app.events.search.on(search)
}

initQueryBuilder().then(function () {
  return initFilters()
}).then(function () {
  return initUi()
})
