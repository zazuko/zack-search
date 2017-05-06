function TypeFilter (options) {
  this.options = options || {}
}

TypeFilter.prototype.name = "TypeFilter"

TypeFilter.prototype.init = function (app) {
  var self = this

  this.app = app
  console.log(this.options)
}

module.exports = TypeFilter
