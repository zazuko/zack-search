var clone = require('lodash/clone')

function QueryBuilder (filters, parts) {
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
  var parts = this.parts

  // merge parts
  Object.keys(parts).forEach(function (part) {
    template = template.split(('${' + part + '}')).join(parts[part])
  })

  // merge filters
  template = template.split('${filters}').join(this.buildFilters())

  return template
}

QueryBuilder.prototype.buildFilters = function () {
  var ind = '      '

  if (this.filters.length === 0) {
    return ''
  }

  var sparql = this.filters.map(function (filter) {
    var propertyPathPrefix = filter.propertyPathPrefix || ''
    var propertyPathPostfix = filter.propertyPathPostfix || ''

    if (filter.operator === '=') {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ' + filter.value + ' .'
    } else if (filter.operator === 'IN') {
      var value = filter.value

      if (Array.isArray(value)) {
        value = value.join(', ')
      }

      value = '(' + value + ')'

      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ?' + filter.variable + ' .\n' +
        ind + 'FILTER (?' + filter.variable + ' ' + filter.operator + ' ' + value + ')'
    } else {
      return ind + '?sub ' + propertyPathPrefix + '<' + filter.predicate + '>' + propertyPathPostfix + ' ?' + filter.variable + ' .\n' +
        ind + 'FILTER (?' + filter.variable + ' ' + filter.operator + ' ' + filter.value + ')'
    }
  }).join('\n')

  sparql = '\n    GRAPH ?g {\n' + sparql + '    \n    }'

  return sparql
}

QueryBuilder.compactFilters = function (filters) {
  // remove empty filters
  filters = filters.filter(function (filter) {
    return filter.value
  })

  // merge = filters with the same predicate to IN filter
  filters = filters.reduce(function (filters, filter) {
    var existing = filters.filter(function (existing) {
      return filter.operator === 'IN' &&
        existing.operator === 'IN' &&
        existing.predicate === filter.predicate
    }).shift()

    if (existing) {
      if (Array.isArray(existing.value)) {
        existing.value.push(filter.value)
      } else {
        // clone and replace filter so we don't touch the original
        var inFilter = clone(existing)

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

module.exports = QueryBuilder
