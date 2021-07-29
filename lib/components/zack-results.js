import { css, html, LitElement } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { SparqlSearchResultList } from '../SparqlSearchResult'
import './zack-result'
import { ScrollObserverController } from '../controller/scrollObserver'
import { debounce } from 'debounce'

class ZackResults extends LitElement {
  static get properties () {
    return {
      app: { type: Object },
      results: { type: Array },
      compact: { type: Boolean }
    }
  }

  static get styles () {
    return css`:host {
      display: block;
    }`
  }

  constructor () {
    super()
    this.results = []
    this.intersection = new ScrollObserverController(this)

    this.load = debounce(async results => {
      const [first] = results
        .sort((left, right) => left.offset - right.offset)
        .filter(({ subject }) => !subject)

      if (!first) return

      const page = await this.sparqlList.fetchPage(first.offset)
      const subjects = this.sparqlList.resultSubjects(page)

      let current = first
      for (const subject of subjects) {
        if (!current) break

        current.graph = page
        current.subject = subject
        current = current.nextElementSibling
      }
    })
  }

  updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      this.sparqlList = new SparqlSearchResultList({
        endpointUrl: this.app.getFullEndpointUrl(this.app.options.endpointUrl),
        pageSize: this.app.options.resultList.pageSize,
        preload: this.app.options.resultList.preload,
        resultTypes: this.app.options.resultTypes
      })

      this.app.queryBuilder.setFilters(this.app.options.resultTypes.map(resultType => ({
        operator: 'IN',
        predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        termType: 'NamedNode',
        variable: 'resultType',
        value: resultType
      })))

      this.sparqlList.buildMetadataFilterQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'count'))
      this.sparqlList.buildResultFilterQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'search'))

      this.app.queryBuilder.setParts({
        textmatch: ''
      })

      this.init()
    }
  }

  render () {
    const { start, end } = this.sparqlList || {}
    return html`
      ${repeat(this.results, (_, i) => html`
        <zack-result ?compact="${this.compact}"
                     .range="${{ start, end }}"
                     .offset="${i}"
                     ${this.intersection.observe()}
        ></zack-result>
      `)}
    `
  }

  async init () {
    this.app.events.fetching.trigger()
    const length = await this.sparqlList.fetchResultLength()
    const { start, end } = this.sparqlList

    this.results = []
    await this.updateComplete
    this.results = new Array(length)
    this.app.events.resultMetadata.trigger({
      length,
      start,
      end
    })
    this.app.events.fetched.trigger()
  }
}

customElements.define('zack-results', ZackResults)
