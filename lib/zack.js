import defaults from 'lodash/defaults'
import * as queries from './queries'
import { Event } from 'crab-event'
import { QueryBuilder } from './query-builder'
import { ResultList } from './result-list'
import { terms } from './terms'

export default function Zack (options) {
  const self = this

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
  this.plugins.push(new ResultList(this.options.resultList))

  // custom plugins
  this.plugins = this.plugins.concat(this.options.plugins)

  this.isFetching = 0

  this.terms = {
    ...terms,
    ...(options.terms || {})
  }

  this.typeFilters = {}
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

Zack.prototype.getResultInterval = function (pointer) {
  if (typeof this.options.getResultInterval === 'function') {
    return this.options.getResultInterval.call(this, pointer)
  }

  const intervalStarts = pointer.out(this.terms.intervalStarts).values.shift()
  const intervalEnds = pointer.out(this.terms.intervalEnds).values.shift()

  return {
    intervalStarts, intervalEnds
  }
}
