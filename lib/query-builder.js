/* eslint-disable no-template-curly-in-string */
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
  this.setParts(parts)
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

  const { order } = store.state.search
  const orderPatterns = sparql`
    ${order.patterns || ''}
    
    BIND (str(${order.variable}) as ?_sort_string)
  `
  let orderExpressions = ''
  const expression = order.descending ? sparql`DESC(${order.variable})` : order.variable

  if (order.customExpression) {
    orderExpressions = interpolate(order.customExpression, { expression })
  } else {
    orderExpressions = expression
  }

  return interpolate(template, {
    filters,
    orderPatterns,
    orderBy: sparql`ORDER BY ${orderExpressions}`,
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
      return sparql`${ind} ?sub ${propertyPathPrefix}${predicate}${propertyPathPostfix} ${value} .`
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
