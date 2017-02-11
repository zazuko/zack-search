var Promise = require('bluebird')
var debounce = require('debounce')
var filter = require('./filter')
var Event = require('crab-event').Event
var Histogram = require('./histogram')
var QueryBuilder = require('./query-builder')
var ResultList = require('./result-list')
var Timeline = require('./timeline')

function Zack (options) {
  var self = this

  this.options = options

  this.options.queries = {
    fusekiSearch: require('../.build/zack-sparql'),
    fusekiCount: require('../.build/zack-count-sparql'),
    fusekiHistogram: require('../.build/zack-histogram-sparql'),
    fusekiTextmatch: require('../.build/zack-textmatch-part-sparql')
  }

  this.events = {
    fetched: new Event(),
    fetching: new Event(),
    filterChange: new Event(),
    filterDuplicate: new Event(),
    resize: new Event(),
    search: new Event()
  }

  window.onresize = function () {
    self.events.resize.trigger()
  }

  this.plugins.push(new ResultList())

  this.isFetching = 0
  this.renderHistogram = false

  this.filters = []
  this.staticFilters = []
}

Zack.prototype.plugins = []

Zack.prototype.findPlugin = function (name) {
  return this.plugins.filter(function (plugin) {
    return plugin.name === name
  }).shift()
}

Zack.prototype.search = function () {
  var query = document.getElementById('query').value

  if (query.trim() !== '') {
    query = query.replace('"', '').trim()
  } else {
    query = null
  }

  // only use the textmatch SPARQL part if query is not empty
  this.queryBuilder.setParts({
    'textmatch': query ? this.getQuery(this.options.endpointUrl, 'textmatch') : ''
  })

  this.searchText = query
}

Zack.prototype.updateTimeline = function () {
  var resultList = this.findPlugin('ResultList')

  if (resultList) {
    this.timeline.render(resultList.resultList.start, resultList.resultList.end)
  }

  this.histogram.clear()
}

Zack.prototype.updateHistogram = function () {
  this.histogram.render(this.searchText)
  this.renderHistogram = false
}

Zack.prototype.getQuery = function (endpointUrl, id) {
  return this.options.queries[this.options.endpoints[endpointUrl].queries[id]]
}

Zack.prototype.updateFilters = function () {
  var htmlFilters = filter.fromElements(document.querySelectorAll('[data-filter]'), this.events.filterChange.trigger)

  // build filter list from HTML elements and static filters
  this.filters = htmlFilters.concat(this.staticFilters)

  this.events.filterChange.trigger()
}

Zack.prototype.removeFilter = function (element) {
  element.parentNode.removeChild(element)

  this.updateFilters()
}

Zack.prototype.containsFilter = function (other) {
  return this.filters.some(function (existing) {
    return filter.compare(existing, other)
  })
}

Zack.prototype.addFilter = function (label, operator, predicate, value, options) {
  var instance

  if (arguments.length === 1) {
    var element = label

    label = element.getAttribute('data-label') || element.textContent
    instance = filter.fromElement(element)
  } else {
    instance = filter(operator, predicate, value, options)
  }

  if (this.containsFilter(instance)) {
    this.events.filterDuplicate.trigger({
      label: label,
      filter: instance
    })

    return
  }

  document.getElementById(this.options.filterContainer).appendChild(filter.toElement(label, instance, this))

  this.updateFilters()
}

Zack.prototype.initUi = function () {
  var self = this

  // init plugins
  return Promise.all(this.plugins.map(function (plugin) {
    return plugin.init(self)
  })).then(function () {
    // timeline
    self.timeline = new Timeline({margin: {top: 40, right: 20, bottom: 0, left: 20}})

    self.events.resize.on(self.updateTimeline.bind(self))
    self.events.resultMetadata.on(self.updateTimeline.bind(self))
  }).then(function () {
    // histogram
    self.histogram = new Histogram({
      endpointUrl: self.options.endpointUrl,
      margin: {top: 0, right: 20, bottom: 0, left: 20}
    })

    self.histogram.buildQuery = self.queryBuilder.createBuilder(self.getQuery(self.options.endpointUrl, 'histogram'))

    self.events.resultMetadata.on(function () {
      self.renderHistogram = true
    })

    self.events.fetched.on(function () {
      setTimeout(function () {
        if (self.renderHistogram && !self.isFetching) {
          self.updateHistogram()
        }
      }, 1)
    })

    self.events.resize.on(debounce(self.updateHistogram.bind(self), 500))
  }).then(function () {
    // query field
    document.getElementById('query').onkeyup = debounce(function () {
      self.events.search.trigger()
    }, 250)
  }).then(function () {
    return self.updateFilters()
  }).then(function () {
    return self.events.search.trigger()
  })
}

Zack.prototype.initQueryBuilder = function () {
  var self = this

  this.queryBuilder = new QueryBuilder()

  if (this.options.resultTypes) {
    this.options.resultTypes.forEach(function (resultType) {
      self.staticFilters.push({
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

Zack.prototype.initFilters = function () {
  var self = this

  this.events.filterChange.on(function () {
    self.queryBuilder.setFilters(self.filters)
    self.events.search.trigger()
  })

  this.events.search.on(this.search.bind(this))

  return Promise.resolve()
}

Zack.prototype.init = function () {
  var self = this

  return this.initQueryBuilder().then(function () {
    return self.initFilters()
  }).then(function () {
    return self.initUi()
  })
}

module.exports = Zack
