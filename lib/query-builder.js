/* eslint-disable no-template-curly-in-string */
import clone from 'lodash/clone'
import { sparql } from '@tpluscode/sparql-builder'
import { store } from './store'

function interpolate (template, params) {
  const names = Object.keys(params)
  const vals = Object.values(params)
  // eslint-disable-next-line no-new-func
  return new Function('tag', ...names, `return tag\`${template}\`;`)(sparql, ...vals)
}

export function QueryBuilder (filters, parts) {
  this.setFilters(filters)
  this.setParts(parts)
}

QueryBuilder.prototype.setFilters = function (filters) {
  this.filters = QueryBuilder.compactFilters(filters || [])
}

QueryBuilder.prototype.setParts = function (parts) {
  this.parts = parts || {}
}

QueryBuilder.prototype.createBuilder = function (template) {
  return (params) => this.build(template, params)
}

QueryBuilder.prototype.build = function (template, params) {
  const parts = this.parts

  const filters = this.buildFilters()
  return interpolate(template, {
    filters,
    ...parts,
    ...params
  }).toString()
}

QueryBuilder.prototype.buildFilters = function () {
  const ind = '      '

  const filters = Object.values(store.state.search.filters)

  if (filters.length === 0) {
    return ''
  }

  return filters.map(function (filter) {
    const propertyPathPrefix = filter.propertyPathPrefix || ''
    const propertyPathPostfix = filter.propertyPathPostfix || ''
    let value = filter.value

    if (Array.isArray(value)) {
      value = value.map(function (v) {
        if (filter.termType === 'NamedNode') {
          return '<' + v + '>'
        } else {
          return '"' + v + '"' // TODO: escape literal
        }
      }).join(', ')
    } else {
      if (filter.termType === 'NamedNode') {
        value = '<' + value + '>'
      } else {
        value = '"' + value + '"' // TODO: escape literal
      }
    }

    if (filter.expression) {
      return sparql`${ind} ${filter.expression}`
    }
    if (filter.operator === '=') {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ' + value + ' .'
    }
    if (filter.operator === 'IN') {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ?' + filter.variable + ' .\n' +
        ind + 'FILTER (?' + filter.variable + ' ' + filter.operator + ' (' + value + '))'
    }
    return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ?' + filter.variable + ' .\n' +
      ind + 'FILTER (?' + filter.variable + ' ' + filter.operator + ' ' + value + ')'
  })
}

QueryBuilder.compactFilters = function (filters) {
  // remove empty filters
  filters = filters.filter(function (filter) {
    return filter.value
  })

  // merge = filters with the same predicate to IN filter
  filters = filters.reduce(function (filters, filter) {
    const existing = filters.filter(function (existing) {
      return filter.operator === 'IN' &&
        existing.operator === 'IN' &&
        existing.predicate === filter.predicate
    }).shift()

    if (existing) {
      if (Array.isArray(existing.value)) {
        existing.value.push(filter.value)
      } else {
        // clone and replace filter so we don't touch the original
        const inFilter = clone(existing)

        inFilter.operator = 'IN'
        inFilter.value = [existing.value, filter.value]

        filters.splice(filters.indexOf(existing), 1, inFilter)
      }
    } else {
      filters.push(filter)
    }

    return filters
  }, [])

  return filters
}
