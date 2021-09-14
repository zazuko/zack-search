import cancelableFetch from 'cancelable-fetch'
import debounce from 'debounce'
import fetch from 'nodeify-fetch'
import SparqlClient from 'sparql-http-client/SimpleClient'
import * as d3 from 'd3'
import { css, html } from 'lit'
import { time } from '@tpluscode/rdf-ns-builders'
import { connect } from '@captaincodeman/rdx'
import { ZackComponent } from './ZackComponent'
import { store } from '../store'

class ZackTimeline extends connect(store, ZackComponent) {
  static get properties () {
    return {
      marginTop: { type: Number, attribute: 'margin-top' },
      marginRight: { type: Number, attribute: 'margin-right' },
      marginLeft: { type: Number, attribute: 'margin-left' },
      marginBottom: { type: Number, attribute: 'margin-bottom' },
      height: { type: Number }
    }
  }

  static get styles () {
    return css`
      :host {
        padding-left: 0;
      }
      
      .svg-bar {
        fill: steelblue;
        shape-rendering: crispEdges;
      }
      
      .svg-handle {
        fill: gray;
        shape-rendering: crispEdges;
        y: -3px;
        cursor: ew-resize;
      }
      
      #timeline-axis path {
        fill: #EBEBEB;
        stroke: #EBEBEB;
        shape-rendering: crispEdges;
      }
      
      
      #timeline-axis line {
        stroke: #fff;
        stroke-width: 2;
        shape-rendering: crispEdges;
      }
      
      #timeline-axis text {
        font: 12px sans-serif;
        fill: #666;
      }
      
      
      #histogram rect {
        fill: #666;
      }`
  }

  constructor () {
    super()
    this.marginTop = 0
    this.marginRight = 0
    this.marginBottom = 20
    this.marginLeft = 0
  }

  render () {
    return html`<div class="zack-timeline"></div>`
  }

  mapState (state) {
    return {
      searchText: state.search.textQuery
    }
  }

  firstUpdated () {
    // - Set options -
    this.options = {
      margin: {
        top: this.marginTop,
        right: this.marginRight,
        bottom: this.marginBottom,
        left: this.marginLeft
      }
    }

    this.margin = this.options.margin

    // get different sizes defined by windows size
    this.width = this.offsetWidth
    this.innerWidth = this.width - this.margin.left - this.margin.right
    this.innerHeight = this.height - this.margin.top - this.margin.bottom

    // - Set up container -

    // main container
    this.timelineContainer = d3.select(this.renderRoot).select('.zack-timeline').append('svg')
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

    this.histogram = this.timeline
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

    this._init()

    store.dispatch.search.addListener(() => {
      this.app.queryBuilder.setParts({
        textmatch: store.state.search.textQuery ? this.app.getQuery(this.app.options.endpointUrl, 'textmatch') : null
      })
      this._render()
    })
  }

  _init () {
    this.client = new SparqlClient({
      fetch,
      endpointUrl: this.app.getFullEndpointUrl(this.app.options.endpointUrl)
    })
    this.buildQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'histogram'))
    this.renderHistogram = false

    this.app.events.resultMetadata.on(({ start, end }) => {
      this.start = start
      this.end = end
      this.renderHistogram = true
    })

    // Render
    this.app.events.fetched.on(() => {
      setTimeout(() => {
        if (this.renderHistogram && !this.app.isFetching) {
          this._render()
        }
      }, 1)
    })

    // Resize handler
    this.app.events.resize.on(debounce(this._render.bind(this), 500))
  }

  clear () {
    this.histogram.selectAll('.bar').remove()
  }

  _render () {
    // - Resize -

    // force remove
    this.clear()

    // update width in case of resize
    this.width = this.offsetWidth
    this.innerWidth = this.width - this.margin.left - this.margin.right

    // resize container (explicit margin convention)
    this.timelineContainer
      .attr('width', this.innerWidth + this.margin.left + this.margin.right)
      .attr('height', this.innerHeight + this.margin.top + this.margin.bottom)

    // - Formulate query and set-up request -

    const query = this.buildQuery()
      .replace(/\${searchString}/g, this.searchText)
      .replace(/\${width}/g, this.renderRoot.querySelector('#timeline-container').width.baseVal.value - this.margin.left - this.margin.right)

    const that = this
    const t = d3.transition().duration(400)

    if (this.request) {
      this.request.cancel()
    }

    this.request = cancelableFetch(this.client.query.select(query, { operation: 'postUrlencoded' }))

    // - Date Extent -

    // get data extent from search
    const start = this.start || new Date()
    const end = this.end || new Date()

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

      // update filters
      const newFromDate = that.x.domain()[0].toISOString()
      const newToDate = that.x.domain()[1].toISOString()

      store.dispatch.search.setFilter({
        id: 'from',
        operator: '>=',
        predicate: time.intervalStarts.value,
        value: newFromDate,
        display: false
      })
      store.dispatch.search.setFilter({
        id: 'to',
        operator: '<=',
        predicate: time.intervalStarts.value,
        value: newToDate,
        display: false
      })
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

    const reset = function () {
      store.dispatch.search.removeFilter({ id: 'from' })
      store.dispatch.search.removeFilter({ id: 'to' })
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

      console.error(err)
    })

    this.renderHistogram = false
  }

  tooltip (count, start, end) {
    const formatDate = d3.timeFormat('%d.%m.%Y')
    return formatDate(start) + '-' + formatDate(end) + ': ' + count + ' Resources'
  }
}

customElements.define('zack-timeline', ZackTimeline)
