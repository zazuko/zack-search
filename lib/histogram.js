/* global Event */
const cancelableFetch = require('cancelable-fetch')
const debounce = require('debounce')
const fetch = require('nodeify-fetch')
const SparqlClient = require('sparql-http-client/SimpleClient')
const d3 = require('d3')

function Histogram (options) {
  // - Set options -
  this.options = options || {}

  this.margin = this.options.margin || { top: 0, right: 0, bottom: 20, left: 0 }
  this.height = this.options.height || 60

  // get different sizes defined by windows size
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right
  this.innerHeight = this.height - this.margin.top - this.margin.bottom

  // - Set up container -

  // main container
  this.timelineContainer = d3.select('#zack-timeline').append('svg')
    .attr('id', 'timeline-container')

  // container for timeline only
  this.timeline = this.timelineContainer.append('g')
    .attr('id', 'timeline')
    .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

  // - Set up axis -

  this.timelineAxis = this.timeline.append('g')
    .attr('id', 'timeline-axis')
    .attr('transform', 'translate(0, ' + this.innerHeight + ')')

  // - Set up histogram -

  this.histogram = d3.select('#timeline')
    .append('g')
    .attr('id', 'histogram')

  // - Set up the brush -

  // Container
  this.brushContainer = this.timeline.append('g')
    .attr('id', 'timeline-brush')

  // Brush component
  this.brush = d3.brushX()
    .extent([[0, 0], [this.innerWidth, this.innerHeight]])

  // Brush mount
  this.brushContainer.call(this.brush)

  // Add handle specifics
  this.fromHandle = d3.select('.handle--w')
    .attr('id', 'from-handle')
    .attr('data-filter', '>=')
    .attr('data-predicate', 'http://www.w3.org/2006/time#intervalStarts')

  this.toHandle = d3.select('.handle--e')
    .attr('id', 'to-handle')
    .attr('data-filter', '<=')
    .attr('data-predicate', 'http://www.w3.org/2006/time#intervalStarts')
}

Histogram.prototype.name = 'Histogram'

Histogram.prototype.init = function (app) {
  const self = this

  // Set up app, cient, query builder

  this.app = app
  this.client = new SparqlClient({
    fetch,
    endpointUrl: this.app.getFullEndpointUrl(this.app.options.endpointUrl)
  })
  this.buildQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'histogram'))
  this.renderHistogram = false

  this.app.events.resultMetadata.on(function () {
    self.renderHistogram = true
  })

  // Render
  this.app.events.fetched.on(function () {
    setTimeout(function () {
      if (self.renderHistogram && !self.app.isFetching) {
        self.render()
      }
    }, 1)
  })

  // Resize handler
  this.app.events.resize.on(debounce(this.render.bind(this), 500))
}

Histogram.prototype.clear = function () {
  this.histogram.selectAll('.bar').remove()
}

Histogram.prototype.render = function () {
  // - Resize -

  // force remove
  this.clear()

  // update width in case of resize
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right

  // resize container (explicit margin convention)
  this.timelineContainer
    .attr('width', this.innerWidth + this.margin.left + this.margin.right)
    .attr('height', this.innerHeight + this.margin.top + this.margin.bottom)

  // - Formulate query and set-up request -

  const searchString = this.app.searchText

  const query = this.buildQuery()
    .replace(/\${searchString}/g, searchString)
    .replace(/\${width}/g, document.getElementById('timeline-container').width.baseVal.value - this.margin.left - this.margin.right)

  const that = this
  const t = d3.transition().duration(400)

  if (this.request) {
    this.request.cancel()
  }

  this.request = cancelableFetch(this.client.query.select(query, { operation: 'postUrlencoded' }))

  // - Date Extent -

  // get data extent from search
  const resultList = this.app.findPlugin('ResultList')

  let start = new Date()
  let end = new Date()

  if (resultList) {
    start = resultList.resultList.start
    end = resultList.resultList.end
  }

  // console.log('result: ', { start: start, end: end });

  // Only show histogram/timeline if both dates are avaialble and there are at least 2 results
  const metadataLength = +d3.select('#count').html()
  this.timelineContainer.transition(t).style('opacity', (start && end && metadataLength > 1) ? 1 : 0)

  // - Scale -

  this.x = d3.scaleUtc()
    .domain([start, end])
    .range([0, this.innerWidth])

  // - Axis -

  // tick helper functions

  const getTickNumberProxy = function (resolution, width) {
    let n = 2
    if (width > 760) {
      n = resolution ? 5 : 10
    } else if (width > 320) {
      n = resolution ? 3 : 5
    }
    return n
  }

  const getTickIncrement = function (ticks) {
    const increments = []
    ticks.forEach(function (el, i, arr) {
      if (i) {
        increments.push(el - arr[i - 1])
      }
    })
    return increments
  }

  const flagIncrement = function (inc, avgInc, threshold) {
    return (inc < threshold * avgInc)
  }

  const editTicks = function (tickArr) {
    // Allow axis with only start and end ticks
    if (tickArr.length < 3) return tickArr

    // Calculate increments in miliseconds between each contiguous tick-pair
    const increments = getTickIncrement(tickArr)
    // Establish normal tick increment
    const medianIncrement = d3.median(increments)
    // Higher threshold factors afford more space between ticks (used for %b %Y labels)
    const threshold = resolutionMonth ? 0.5 : 0.33

    // Establish which tick value needs to be removed
    const removeSecondTick = flagIncrement(increments[0], medianIncrement, threshold)
    const removePenultimateTick = flagIncrement(increments[increments.length - 1], medianIncrement, threshold)

    // Set tight tick to false
    if (removeSecondTick) tickArr[1] = false
    if (removePenultimateTick) tickArr[tickArr.length - 2] = false

    // Get final tick array
    const newTickArr = tickArr.filter(function (el) {
      return el !== false
    })

    return newTickArr
  }

  // Fewer ticks for axis with longer month labels and smaller displays
  const resolutionMonth = d3.timeYears(start, end).length <= Math.floor(this.innerWidth / 100)
  const tickNumberProxy = getTickNumberProxy(resolutionMonth, window.innerWidth)
  const tickValuesArray = this.x.ticks(tickNumberProxy)

  // Guarantee start and end ticks
  const updatedTicks = [start, end]
    .concat(tickValuesArray)
    .sort(function (a, b) {
      return a - b
    })

  // Get final tick array
  const editedTicks = editTicks(updatedTicks)

  // Axis component
  this.xAxis = d3.axisBottom()
    .scale(this.x)
    .tickValues(editedTicks)
    .tickSize(-this.innerHeight)
    .tickFormat(resolutionMonth ? d3.timeFormat('%b %Y') : d3.timeFormat('%Y'))

  // Draw Axis
  this.timelineAxis
    .transition(t)
    .call(this.xAxis)

  // - Brush handler -

  const zoom = function () {
    // update axis
    that.timelineAxis.transition(t).call(that.xAxis)

    // update handles
    const newFromDate = that.x.domain()[0].toISOString()
    const newToDate = that.x.domain()[1].toISOString()

    that.fromHandle.attr('data-value', newFromDate)
    that.toHandle.attr('data-value', newToDate)

    // trigger event
    that.fromHandle.node().dispatchEvent(new Event('change'))
    that.toHandle.node().dispatchEvent(new Event('change'))
  }

  const brushended = function (that) {
    const area = d3.event.selection

    if (!area) return

    // If an area is selected adjust the domain...
    that.x.domain([area[0], area[1]].map(that.x.invert, that.x))

    // console.log('domain: ', that.x.domain())

    // ...and clear the brush.
    that.brushContainer.call(that.brush.move, null)

    // zoom() will move our elements.
    zoom()
  }

  const reset = function (that) {
    that.fromHandle.attr('data-value', null)
    that.toHandle.attr('data-value', null)

    that.fromHandle.node().dispatchEvent(new Event('change'))
    that.toHandle.node().dispatchEvent(new Event('change'))
  }

  // Init brush listener
  this.brush.on('end', function () {
    brushended(that)
  })

  // Reset brush
  d3.selectAll('.zack-reset')
    .on('mousedown', function () {
      reset(that)
    })

  d3.selectAll('.overlay')
    .on('dblclick', function () {
      reset(that)
    })

  // Start visual cue during load (histogram background opacity change)
  const axisDomain = this.timelineAxis.select('.domain')

  const timer = d3.interval(function (elapsed) {
    // Map elapsed time to opacity values between 0.3 and 1
    const opacity = 0.3 * Math.sin(2 * Math.PI / 2000 * elapsed) + 0.7
    axisDomain.style('fill-opacity', opacity)
  })

  // - Bar render -

  // Send async request
  this.request.then(function (res) {
    return res.json()
  }).then(function (histData) {
    const data = histData.results.bindings[0].bucket ? histData.results.bindings : []

    // Stop loading cue
    timer.stop()
    axisDomain.style('fill-opacity', 1)

    // Build bars
    const scale = d3.scalePow()
      .exponent(0.5)
      .domain([0, d3.max(data, function (d) { return parseInt(d.histo.value) })])
      .range([0, that.innerHeight])

    /*  var colorScale = d3.scalePow()
          .exponent(0.5)
          .domain([0, d3.max(data, function(d) {return parseInt(d.histo.value)})])
          .range(["darkblue","steelblue"])
    */

    that.histogram.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', function (d) { return d.bucket.value })
      .attr('width', '1px')
      // .attr("fill", function(d) { return colorScale(d.histo.value) })
      .attr('y', function (d) { return that.innerHeight - scale(d.histo.value) })
      .attr('height', function (d) { return scale(d.histo.value) })
      .append('title')
      .text(function (d) { return that.tooltip(d.histo.value, new Date(d.bucket_start.value), new Date(d.bucket_end.value)) })

    // Highlight the axis' start and end value
    const tickExtent = that.timelineAxis.selectAll('g.tick').filter(function (el, i, nodes) {
      return i === 0 || i === nodes.length - 1
    })

    // Reset all tick labels to normal and bolden only start and end tick
    that.timelineAxis.selectAll('text').style('font-weight', 'normal')
    tickExtent.selectAll('text').style('font-weight', 'bold')

    that.request = null
  }).catch(function (err) {
    // Stop loading cue
    timer.stop()
    axisDomain.style('fill-opacity', 1)

    if (err.message === 'user cancellation') {}
  })

  this.renderHistogram = false
}

Histogram.prototype.tooltip = function (count, start, end) {
  const formatDate = d3.timeFormat('%d.%m.%Y')
  return formatDate(start) + '-' + formatDate(end) + ': ' + count + ' Resources'
}

module.exports = Histogram
