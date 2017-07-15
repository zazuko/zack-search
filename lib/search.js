var debounce = require('debounce')
var filter = require('./filter')
var qs = require('qs')
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
    if (document.getElementById('clear') && document.getElementById('query').value) { //clear button exists and value is set
        document.getElementById('clear').style.visibility = 'visible'; //make button visible
    }
  }, 250)

  if (document.getElementById('clear')) {
    document.getElementById('clear').onclick = function () {
      document.getElementById('query').value = ''
      document.getElementById('clear').style.visibility = 'hidden';
      self.app.events.search.trigger()
    }
  }


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

  // q query parameter -> searchText
  var params = this.params()

  if (params.q) {
    this.searchText(params.q)
  }

  return this.updateFilters()
}

Search.prototype.params = function () {
  var queryString = window.location.search.split('?', 2).pop()

  return queryString ? qs.parse(queryString) : {}
}

Search.prototype.searchText = function (searchText) {
  var queryElement = document.getElementById('query')

  if (searchText !== undefined) {
    queryElement.value = searchText

    if (document.getElementById('clear')) {
      document.getElementById('clear').style.visibility = 'visible';
    }

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
    'textmatch': searchText ? this.app.getQuery(this.app.options.endpointUrl, 'textmatch') : null
  })

  this.app.searchText = searchText

  var params = this.params()

  if (this.app.searchText !== params.q) {
    // build new URL
    if (this.app.searchText) {
      window.history.replaceState(null, null, '?q=' + this.app.searchText)
    } else {
      window.history.replaceState(null, null, window.location.pathname)
    }
  }
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
