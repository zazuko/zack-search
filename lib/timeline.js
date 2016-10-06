/* global Event */
var d3 = require('d3')

function Timeline (options) {
  this.start = ''
  this.end = ''

  this.options = options || {}

  this.margin = this.options.margin || {top: 0, right: 0, bottom: 0, left: 0}
  this.height = this.options.height || 60

  // get different sizes defined by windows size
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right
  this.innerHeight = this.height - this.margin.top - this.margin.bottom

  // main objects
  this.timelineContainer = d3.select('#zack-timeline').append('svg')
      .attr('id', 'timeline-container')

  this.timeline = this.timelineContainer.append('g')
      .attr('id', 'timeline')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

  // handles
  this.timelineHandles = this.timeline.append('g')
      .attr('id', 'timeline-handles')
      .attr('transform', 'translate(0, -' + this.margin.top + ')')

  var that = this
  var move = function (d, i, s) {
    if (s[0].id === 'from-handle') {
      d3.select(s[0]).attr('x', d3.event.x - that.margin.left)
    }
    if (s[0].id === 'to-handle') {
      d3.select(s[0]).attr('x', d3.event.x - that.margin.left + that.handleWidth)
    }
  }
  var filter = function (d, i, s) {
    if (s[0].id === 'from-handle') {
      var newFromDate = that.x.invert(d3.event.x - that.margin.left).toISOString()
      if (d3.select(s[0]).attr('data-value') == null || (new Date(d3.select(s[0]).attr('data-value')) < new Date(newFromDate))) {
        d3.select(s[0]).attr('data-value', newFromDate)
        d3.select(s[0]).style('fill', 'red')
      } else {
        d3.select(s[0]).attr('data-value', null)
        d3.select(s[0]).style('fill', null)
      }
      s[0].dispatchEvent(new Event('change'))
    }
    var newToDate = that.x.invert(d3.event.x - that.margin.left + that.handleWidth).toISOString()
    if (s[0].id === 'to-handle') {
      if (d3.select(s[0]).attr('data-value') == null || (new Date(d3.select(s[0]).attr('data-value')) > new Date(newToDate))) {
        d3.select(s[0]).attr('data-value', newToDate)
        d3.select(s[0]).style('fill', 'red')
      } else {
        d3.select(s[0]).attr('data-value', null)
        d3.select(s[0]).style('fill', null)
      }
      d3.select(s[0]).attr('fill', 'red')
      s[0].dispatchEvent(new Event('change'))
    }
  }

  var drag = d3.drag().on('drag', move).on('end', filter)

  this.fromHandle = this.timelineHandles.append('rect')
      .attr('id', 'from-handle')
      .attr('class', 'handle')
      .attr('data-filter', '>=')
      .attr('data-predicate', 'http://www.w3.org/2006/time#intervalStarts')
      .attr('visibility', 'hidden')
      .attr('width', '5px')
      .attr('height', '50px')
      .attr('x', '0')
      .call(drag)

  this.handleWidth = this.fromHandle.node().getBoundingClientRect().width

  this.toHandle = this.timelineHandles.append('rect')
      .attr('id', 'to-handle')
      .attr('class', 'handle')
      .attr('data-filter', '<=')
      .attr('data-predicate', 'http://www.w3.org/2006/time#intervalStarts')
      .attr('visibility', 'hidden')
      .attr('width', '5px')
      .attr('height', '50px')
      .attr('x', this.width - this.margin.left - this.margin.right - this.handleWidth)
      .call(drag)

  // axis element
  this.timelineAxis = this.timeline.append('g')
      .attr('id', 'timeline-axis')
}

Timeline.prototype.render = function (start, end) {
  // update in case resize occured
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right

  // scale
  this.x = d3.scaleUtc()
    .domain([start, end])
    .range([0, this.innerWidth])

  // axis with ticks
  var resolutionMonth = d3.timeYears(start, end).length <= Math.floor(this.innerWidth / 100)
  this.xAxis = d3.axisBottom()
    .scale(this.x)
    .tickFormat(resolutionMonth ? d3.timeFormat('%b %Y') : d3.timeFormat('%Y'))
    .tickValues(
        [start, end].concat( // add the first and last year
            d3.scaleUtc().domain(this.x.domain()) // use UTC domain
              .ticks(Math.floor(this.innerWidth / 100)) // get ticks roughly 50px appart
              .slice(0, -1) // remove the first and last tick
        )
    )
  // resize Container
  this.timelineContainer
    .attr('width', this.width)
    .attr('height', this.height)

  // render axis
  this.timelineAxis
    .transition()
    .duration(400)
    .call(this.xAxis)

  // reposition handles and make them visible
  this.fromHandle
    .attr('visibility', 'visible')
    .attr('x', 0)
  this.toHandle
    .attr('visibility', 'visible')
    .attr('x', this.width - this.margin.left - this.margin.right - this.handleWidth)
}

module.exports = Timeline
