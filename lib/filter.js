var dragged = null

function filter (operator, predicate, value, options) {
  options = options || {}

  return {
    operator: operator,
    predicate: predicate,
    value: value,
    termType: (options.namedNode ? 'NamedNode' : 'Literal'),
    propertyPathPrefix: options.propertyPathPrefix,
    propertyPathPostfix: options.propertyPathPostfix,
    variable: options.variable
  }
}

filter.fromElement = function (element, index, changeCallback) {
  index = index || 0

  var operator = element.getAttribute('data-filter') || element.getAttribute('data-filterable')
  var predicate = element.getAttribute('data-predicate')
  var options = {
    propertyPathPrefix: element.getAttribute('data-property-path-prefix'),
    propertyPathPostfix: element.getAttribute('data-property-path-postfix'),
    namedNode: element.getAttribute('data-named-node') !== null,
    variable: 'filter' + index
  }

  var eventName = 'onchange'
  var getValue = function (element) {
    var value = element.value || element.getAttribute('data-value')
    return value
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

filter.toElement = function (label, instance, search) {
  var element = document.createElement('div')

  // css
  element.setAttribute('class', 'filter-item')

  // data
  element.setAttribute('data-filter', instance.operator)
  element.setAttribute('data-predicate', instance.predicate)

  if (instance.propertyPathPrefix) {
    element.setAttribute('data-property-path-prefix', instance.propertyPathPrefix)
  }

  if (instance.propertyPathPostfix) {
    element.setAttribute('data-property-path-postfix', instance.propertyPathPostfix)
  }

  element.setAttribute('data-value', instance.value)

  if (instance.termType === 'NamedNode') {
    element.setAttribute('data-named-node', true)
  }

  // content
  element.innerHTML = label

  // events
  element.addEventListener('click', function () {
    search.removeFilter(this)
  })

  element.draggable = true

  element.addEventListener('dragstart', function (event) {
    dragged = event.target
  })

  element.addEventListener('dragover', function (event) {
    event.preventDefault()
  })

  element.addEventListener('drop', function (event) {
    console.log(element.attributes['data-value'])
    console.log(dragged.attributes['data-value'])

    element.setAttribute('data-filter', 'IN')
    dragged.setAttribute('data-filter', 'IN')

    search.updateFilters()
  })

  return element
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
