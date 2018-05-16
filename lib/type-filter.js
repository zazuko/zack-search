const colorHash = new (require('color-hash'))()

function TypeFilter (options) {
  this.options = options || {}
}

TypeFilter.prototype.name = 'TypeFilter'

TypeFilter.prototype.init = function (app) {
  this.app = app
  const values = this.options.values

  let typeFilters = ''
  for (const tf in values) {
    const color = colorHash.hex(tf.substring(tf.lastIndexOf('/') + 1, tf.length))
    typeFilters = '<div style="background-color:' + color + ' ;"' +
       'data-filterable="=" ' +
       'data-predicate="' + this.options.predicate + '"' +
       'data-value="' + tf + '"' +
       'data-named-node class="type-filter" ' +
       'onclick="app.search.addFilter(this)">' +
       '<i class="fa ' + values[tf].icon + '"></i> ' +
       values[tf].title +
       '</div>' + typeFilters
  }

  document.getElementById('type-filters').innerHTML = typeFilters
}

module.exports = TypeFilter
