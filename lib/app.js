var Promise = require('bluebird')
var Event = require('crab-event').Event
var Histogram = require('./histogram')
var QueryBuilder = require('./query-builder')
var ResultList = require('./result-list')
var Search = require('./search')
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
    resize: new Event()
  }

  window.onresize = function () {
    self.events.resize.trigger()
  }

  this.plugins = []
  this.plugins.push(new Search())
  this.plugins.push(new ResultList())
  this.plugins.push(new Timeline({margin: {top: 40, right: 20, bottom: 0, left: 20}}))
  this.plugins.push(new Histogram({
    endpointUrl: this.options.endpointUrl,
    margin: {top: 0, right: 20, bottom: 0, left: 20}
  }))

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
