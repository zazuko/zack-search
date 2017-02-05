function filter (operator, predicate, value, options) {
  return {
    operator: operator,
    predicate: predicate,
    value: value ? (options.namedNode ? '<' + value + '>' : '"' + value + '"') : null, // TODO: escape literal
    termType: (options.namedNode ? 'NamedNode' : 'Literal'),
    propertyPathPrefix: options.propertyPathPrefix,
    propertyPathPostfix: options.propertyPathPostfix,
    variable: options.variable
  }
}

filter.fromElement = function (element, index, changeCallback) {
  index = index || 0

  var operator = element.getAttribute('data-filter')
  var predicate = element.getAttribute('data-predicate')
  var options = {
    propertyPathPrefix: element.getAttribute('data-property-path-prefix'),
    propertyPathPostfix: element.getAttribute('data-property-path-postfix'),
    termType: element.getAttribute('data-named-node') !== null ? 'NamedNode' : 'Literal',
    variable: 'filter' + index
  }

  var eventName = 'onchange'
  var getValue = function (element) {
    return element.value || element.getAttribute('data-value')
  }

  if (element.nodeName.toLowerCase() === 'input' && element.type.toLowerCase() === 'date') {
    eventName = 'onblur'

    getValue = function (element) {
      if (element.value) {
        return 'xsd:date(\'' + element.value + '\')'
      } else {
        return null
      }
    }
  }

  var value = getValue(element)

  var instance = filter(operator, predicate, value, options)

  if (eventName && changeCallback) {
    element[eventName] = function (event) {
      instance.value = getValue(element)

      changeCallback()
    }
  }

  return instance
}

filter.fromElements = function (elements, changeCallback) {
  elements = Array.prototype.slice.call(elements)

  return elements.filter(function (element) {
    return element.getAttribute('disabled') === null
  }).map(function (element, index) {
    return filter.fromElement(element, index, changeCallback)
  })
}

filter.compare = function (a, b) {
  return a.operator === b.operator &&
    a.predicate === b.predicate &&
    a.value === b.value &&
    a.termType === b.termType &&
    a.propertyPathPrefix === b.propertyPathPrefix &&
    a.propertyPathPostfix === b.propertyPathPostfix
}

module.exports = filter
