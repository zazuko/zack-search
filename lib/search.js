var debounce = require('debounce')
var filter = require('./filter')
var Event = require('crab-event').Event

function Search () {
  this.filters = []
  this.staticFilters = []
}

Search.prototype.init = function (app) {
  var self = this

  this.app = app
  this.app.search = this

  this.app.events.filterChange = new Event()
  this.app.events.filterDuplicate = new Event()
  this.app.events.search = new Event()

  this.app.events.filterChange.on(function () {
    self.app.queryBuilder.setFilters(self.filters)
    self.app.events.search.trigger()
  })

  this.app.events.search.on(this.prepareSearch.bind(this))

  document.getElementById('query').onkeyup = debounce(function () {
    self.app.events.search.trigger()
  }, 250)

  if (this.app.options.resultTypes) {
    this.app.options.resultTypes.forEach(function (resultType) {
      self.staticFilters.push({
        operator: '=',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        termType: 'NamedNode',
        variable: 'resultType',
        value: resultType
      })
    })
  }

  return this.updateFilters().then(function () {
    return self.app.events.search.trigger()
  })
}

Search.prototype.searchText = function (searchText) {
  var queryElement = document.getElementById('query')

  if (searchText !== undefined) {
    queryElement.value = searchText
  }

  searchText = queryElement.value

  if (searchText.trim() !== '') {
    searchText = searchText.replace('"', '').trim()
  } else {
    searchText = null
  }

  return searchText
}

Search.prototype.prepareSearch = function () {
  var searchText = this.searchText()

  // only use the textmatch SPARQL part if query is not empty
  this.app.queryBuilder.setParts({
    'textmatch': searchText ? this.app.getQuery(this.app.options.endpointUrl, 'textmatch') : ''
  })

  this.app.searchText = searchText
}

Search.prototype.updateFilters = function () {
  var htmlFilters = filter.fromElements(document.querySelectorAll('[data-filter]'), this.app.events.filterChange.trigger)

  // build filter list from HTML elements and static filters
  this.filters = htmlFilters.concat(this.staticFilters)

  return this.app.events.filterChange.trigger()
}

Search.prototype.removeFilter = function (element) {
  element.parentNode.removeChild(element)

  this.updateFilters()
}

Search.prototype.containsFilter = function (other) {
  return this.filters.some(function (existing) {
    return filter.compare(existing, other)
  })
}

Search.prototype.addFilter = function (label, operator, predicate, value, options) {
  var instance

  if (arguments.length === 1) {
    var element = label

    label = element.getAttribute('data-label') || element.textContent
    instance = filter.fromElement(element)
  } else {
    instance = filter(operator, predicate, value, options)
  }

  if (this.containsFilter(instance)) {
    return this.app.events.filterDuplicate.trigger({
      label: label,
      filter: instance
    })
  }

  document.getElementById(this.app.options.filterContainer).appendChild(filter.toElement(label, instance, this))

  return this.updateFilters()
}

module.exports = Search
