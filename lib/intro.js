var Shepherd = require('tether-shepherd')

function Intro (options) {
	var self = this

	this.options = options || {}
	this.options.defaults = this.options.defaults || {}
	this.options.steps = this.options.steps || []

	this.tour = new Shepherd.Tour({
		defaults: this.options.defaults
	})

	this.options.steps.forEach(function (step, i, arr) {
		if (step.buttons === 'auto') {
			var backText, nextText
			if (i > 0) { backText = 'back' }
			if (i < arr.length - 1) { nextText = 'next' }
			else { nextText = 'done' }

			step.buttons = []
			if (backText) { step.buttons.push({ text: backText, action: self.tour.back }) }
			if (nextText) { step.buttons.push({ text: nextText, action: self.tour.next }) }
		}

		self.tour.addStep(step)
	})
}

Intro.prototype.name = 'Intro'

Intro.prototype.init = function (app) {
  var self = this

  this.app = app
  this.app.intro = this

  document.getElementById('zack-intro').onclick = self.tour.start
}

module.exports = Intro
