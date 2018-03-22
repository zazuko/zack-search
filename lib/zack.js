var Promise = require('bluebird')
var defaults = require('lodash/defaults')
var queries = require('../.build/queries')
var Event = require('crab-event').Event
var QueryBuilder = require('./query-builder')
var ResultList = require('./result-list')
var Search = require('./search')

function Zack (options) {
  var self = this

  this.options = options

  // merge queries given in options and bundled queries
  this.options.queries = defaults(this.options.queries || {}, queries)

  this.events = {
    fetched: new Event(),
    fetching: new Event(),
    resize: new Event()
  }

  window.onresize = function () {
    self.events.resize.trigger()
  }

  this.plugins = []

  // core plugins
  this.plugins.push(new Search())
  this.plugins.push(new ResultList(this.options.resultList))

  // custom plugins
  this.plugins = this.plugins.concat(this.options.plugins)

  this.isFetching = 0
}

Zack.prototype.findPlugin = function (name) {
  return this.plugins.filter(function (plugin) {
    return plugin.name === name
  }).shift()
}

Zack.prototype.getQuery = function (endpointUrl, id) {
  return this.options.queries[this.options.endpoints[endpointUrl].queries[id]]
}


// LV each plugin will be triggered with its init method

Zack.prototype.initPlugins = function () {
  var self = this

  // init plugins
  return Promise.all(this.plugins.map(function (plugin) {
    return plugin.init(self)
  }))
}

Zack.prototype.init = function () {
  this.queryBuilder = new QueryBuilder()

  return this.initPlugins()
}

module.exports = Zack
