import { SparqlSearchResultList } from '../SparqlSearchResult'

export class ResultsController {
  constructor (host) {
    this.host = host
    host.addController(this)

    this.array = []
  }

  async init () {
    if (!this.app) {
      if (!this.host.app) return

      this.app = this.host.app

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

      this.app.events.resultMetadata.on(({ length }) => {
        this.array = new Array(length)
        this.host.requestUpdate()
      })
    }

    this.app.events.fetching.trigger()
    const length = await this.sparqlList.fetchResultLength()
    const { start, end } = this.sparqlList

    this.app.events.resultMetadata.trigger({
      length,
      start,
      end
    })
    this.app.events.fetched.trigger()
  }

  async load (from = 0) {
    let firstNotLoaded
    const pageSize = this.app.options.resultList.pageSize
    for (let i = from; i < from + pageSize; i++) {
      if (!this.array[i]) {
        firstNotLoaded = i
        break
      }
    }

    if (typeof firstNotLoaded === 'undefined') {
      return
    }

    this.array.splice(firstNotLoaded, pageSize, ...new Array(pageSize).map(() => ({})))

    const graph = await this.sparqlList.fetchPage(firstNotLoaded)
    const subjects = this.sparqlList.resultSubjects(graph)

    const { start, end } = this.sparqlList || {}
    this.array.splice(firstNotLoaded, subjects.length, ...subjects.map(subject => ({
      graph,
      subject,
      range: { start, end }
    })))

    return this.host.requestUpdate()
  }
}
