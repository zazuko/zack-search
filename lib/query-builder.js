/* eslint-disable no-template-curly-in-string */
import clone from 'lodash/clone'
import { sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import * as rdf from '@rdf-esm/data-model'
import { store } from './store'

function interpolate (template, params = {}) {
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
  const filters = this.buildFilters()

  const parts = Object.entries(this.parts).reduce((previous, [key, part]) => {
    if (!part) {
      return { ...previous, [key]: '' }
    }

    return {
      ...previous,
      [key]: interpolate(part, {
        filters,
        ...params
      })
    }
  }, {})

  return interpolate(template, {
    filters,
    ...parts,
    ...params
  }).toString({ prologue: false })
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
    const { value, expression, predicate, operator, expressionParams = {} } = filter

    if (typeof expression === 'object') {
      return sparql`${ind} ${expression}`
    }
    if (typeof expression === 'string') {
      return sparql`${ind} ${interpolate(expression, { value, ...expressionParams })}`
    }

    if (operator === '=') {
      return sparql`${ind} ?sub ${propertyPathPrefix}${predicate}${propertyPathPostfix} ${value}`
    }

    const variable = typeof filter.variable === 'string'
      ? rdf.variable(filter.variable)
      : filter.variable

    if (operator === 'IN') {
      return sparql`${ind} ?sub ${propertyPathPrefix}${predicate}${propertyPathPostfix} ${variable} .
${ind} FILTER ( ${variable} ${IN(...value)} )`
    }

    return sparql`${ind} ?sub ${propertyPathPrefix}${predicate}${propertyPathPostfix} ${variable} .
${ind} FILTER ( ${variable} ${operator} ${value} )`
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
