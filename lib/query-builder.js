/* eslint-disable no-template-curly-in-string */
import clone from 'lodash/clone'

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
  return this.build.bind(this, template)
}

QueryBuilder.prototype.build = function (template) {
  const parts = this.parts

  // merge parts
  Object.keys(parts).forEach(function (part) {
    template = template.split(('${' + part + '}')).join(parts[part] || '')
  })

  // merge filters
  template = template.split('${filters}').join(this.buildFilters())

  return template
}

QueryBuilder.prototype.buildFilters = function () {
  const ind = '      '

  if (this.filters.length === 0) {
    return ''
  }

  const sparql = this.filters.map(function (filter) {
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

    if (filter.operator === '=') {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ' + value + ' .'
    } else if (filter.operator === 'IN') {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ?' + filter.variable + ' .\n' +
        ind + 'FILTER (?' + filter.variable + ' ' + filter.operator + ' (' + value + '))'
    } else {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ?' + filter.variable + ' .\n' +
        ind + 'FILTER (?' + filter.variable + ' ' + filter.operator + ' ' + value + ')'
    }
  }).join('\n')

  return sparql
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
