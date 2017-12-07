var cancelableFetch = require('cancelable-fetch')
var debounce = require('debounce')
var isomorphicFetch = require('isomorphic-fetch')
var SparqlClient = require('sparql-http-client')
var d3 = require('d3')

SparqlClient.types.select.operation = SparqlClient.prototype.postQuery

function Histogram (options) {

  // - Set options -

  this.options = options || {}

  this.margin = this.options.margin || {top: 0, right: 0, bottom: 20, left: 0}
  this.height = this.options.height || 60

  // get different sizes defined by windows size
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right
  this.innerHeight = this.height - this.margin.top - this.margin.bottom

  // - Set up container -

  // main container (TODO change the name)
  this.timelineContainer = d3.select('#zack-timeline').append('svg')
      .attr('id', 'timeline-container')

  // container for timeline only (TODO this will go)
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
      .extent([[0,0], [this.innerWidth, this.innerHeight]]);

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
  var self = this

  // Set up app, cient, query builder

  this.app = app
  this.client = new SparqlClient({
    fetch: isomorphicFetch,
    endpointUrl: this.app.options.endpointUrl,
    updateUrl: this.app.options.endpointUrl
  })
  this.buildQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'histogram'))
  this.renderHistogram = false

  this.app.events.resultMetadata.on(function () {
    self.renderHistogram = true
  })

 // this.app.events.resultMetadata.on(this.render.bind(this))

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

  // force remove (TODO consider data update instead)
  this.clear();

  // update width in case of resize
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right

  // resize container (explicit margin convention)
  this.timelineContainer
    .attr('width', this.innerWidth + this.margin.left + this.margin.right)
    .attr('height', this.innerHeight + this.margin.top + this.margin.bottom)


  // - Formulate query and set-up request -

  var searchString = this.app.searchText

  var query = this.buildQuery()
    .replace(/\${searchString}/g, searchString)
    .replace(/\${width}/g, document.getElementById('timeline-container').width.baseVal.value - this.margin.left - this.margin.right)

  var that = this

  if (this.request) {
    this.request.cancel()
  }

  this.request = cancelableFetch(this.client.selectQuery(query))


  // - Date Extent -

  // get data extent from search
  var resultList = this.app.findPlugin('ResultList')

  var start = new Date()
  var end = new Date()

  if (resultList) {
    start = resultList.resultList.start
    end = resultList.resultList.end
  }

  console.log('result: ', { start: start, end: end });


  // - Scale -

  this.x = d3.scaleUtc()
    .domain([start, end])
    .range([0, this.innerWidth])


  // - Axis -

  // Axis component
  var resolutionMonth = d3.timeYears(start, end).length <= Math.floor(this.innerWidth / 100)

  var updTicks = [start, end]
      .concat(this.x.ticks())
      .sort(function(a,b) {
        return a - b
      })

  this.xAxis = d3.axisBottom()
    .scale(this.x)
    .tickValues(updTicks)
    .tickSize(-this.innerHeight)
    .tickFormat(resolutionMonth ? d3.timeFormat('%b %Y') : d3.timeFormat('%Y'))
    // .tickValues(
    //     [start, end].concat( // add the first and last year
    //         d3.scaleUtc().domain(this.x.domain()) // use UTC domain
    //           .ticks(Math.floor(this.innerWidth / 100)) // get ticks roughly 50px appart
    //           .slice(0, -1) // remove the first and last tick
    //     )
    // )


  // Set transition
  var t = d3.transition().duration(400)

  // Draw Axis
  this.timelineAxis
    .transition(t)
    .call(this.xAxis)




  // - Brush handler - 
  
  var zoom = function () {

    // update axis
    that.timelineAxis.transition(t).call(that.xAxis)

    // update handles
    var newFromDate = that.x.domain()[0].toISOString(),
        newToDate = that.x.domain()[1].toISOString()

    that.fromHandle.attr('data-value', newFromDate)
    that.toHandle.attr('data-value', newToDate)

    // trigger event
    that.fromHandle.node().dispatchEvent(new Event('change'))
    that.toHandle.node().dispatchEvent(new Event('change'))

  }

  var brushended = function (that) {

    var area = d3.event.selection;
    
    if (!area) return 

    // If an area is selected adjust the domain...
    that.x.domain([area[0], area[1]].map(that.x.invert, that.x))

    console.log('domain: ', that.x.domain())

    // ...and clear the brush.
    that.brushContainer.call(that.brush.move, null)

    // zoom() will move our elements.
    zoom();

  }

  var reset = function (that) {

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
  d3.selectAll('.zack-meta.pull-right')
    .style('cursor', 'pointer')
    .on('mousedown', function() {
      reset(that);
    })


  // - Bar render -

  // Send async request
  this.request.then(function (res) {
    return res.json()
  }).then(function (histData) {
    var data = histData.results.bindings[0].bucket ? histData.results.bindings : []

    console.log('histData', data);

    var scale = d3.scalePow()
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

    that.request = null
  }).catch(function (err) {
    if (err.message === 'user cancelation') {
      // canceled fetch
    }
  })

  this.renderHistogram = false
}

Histogram.prototype.tooltip = function (count, start, end) {
  var formatDate = d3.timeFormat('%d.%m.%Y')
  return formatDate(start) + '-' + formatDate(end) + ': ' + count + ' Resources'
}

module.exports = Histogram
