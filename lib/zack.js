import defaults from 'lodash/defaults'
import * as queries from './queries'
import { Event } from 'crab-event'
import { QueryBuilder } from './query-builder'
import { ResultList } from './result-list'

export default function Zack (options) {
  const self = this

  this.options = options

  // merge queries given in options and bundled queries
  this.options.queries = defaults(this.options.queries || {}, queries)

  this.events = {
    resize: new Event()
  }

  window.onresize = function () {
    self.events.resize.trigger()
  }

  this.plugins = []

  // core plugins
  this.plugins.push(new ResultList(this.options.resultList))

  // custom plugins
  this.plugins = this.plugins.concat(this.options.plugins)
}

Zack.prototype.findPlugin = function (name) {
  return this.plugins.filter(function (plugin) {
    return plugin.name === name
  }).shift()
}

Zack.prototype.getQuery = function (endpointUrl, id) {
  return this.options.queries[this.options.endpoints[endpointUrl].queries[id]]
}

Zack.prototype.getFullEndpointUrl = function (endpointUrl) {
  return new URL(endpointUrl, window.location.origin).toString()
}

// LV each plugin will be triggered with its init method

Zack.prototype.initPlugins = function () {
  const self = this

  // init plugins
  return Promise.all(this.plugins.map(function (plugin) {
    return plugin.init(self)
  }))
}

Zack.prototype.init = function () {
  this.queryBuilder = new QueryBuilder()

  return this.initPlugins()
}
