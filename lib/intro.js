/* global Tour */
function Intro (options) {
  this.options = options || {}
  this.options.steps = this.options.steps || []

  this.tour = new Tour(this.options)
}

Intro.prototype.name = 'Intro'

Intro.prototype.init = function (app) {
  const self = this

  this.app = app
  this.app.intro = this

  this.tour.init()

  document.getElementById('zack-intro').onclick = function () {
    self.tour.setCurrentStep(0)
    self.tour.start(true)
  }
}

module.exports = Intro
