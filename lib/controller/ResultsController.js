import { rdf } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@rdf-esm/data-model'
import { findNodes } from 'clownface-shacl-path'
import clownface from 'clownface'
import { SparqlSearchResultList } from '../SparqlSearchResult'
import { store } from '../store'
import { download } from '../download'
import { getProperties } from '../shapes'

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

      store.dispatch.search.setFilter({
        id: 'resultTypes',
        operator: 'IN',
        predicate: rdf.type,
        termType: 'NamedNode',
        variable: 'resultType',
        value: this.app.options.resultTypes.map(namedNode),
        display: false
      })

      this.sparqlList.buildMetadataFilterQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'count'))
      this.sparqlList.buildResultFilterQuery = this.app.queryBuilder.createBuilder(this.app.getQuery(this.app.options.endpointUrl, 'search'))

      this.app.events.resultMetadata.on(({ length }) => {
        this.array = new Array(length)
        this.host.requestUpdate()
      })
    }

    try {
      this.app.queryBuilder.setParts({
        textmatch: store.state.search.textQuery ? this.app.getQuery(this.app.options.endpointUrl, 'textmatch') : null
      })

      this.app.events.fetching.trigger()
      const length = await this.sparqlList.fetchResultLength()
      const { start, end } = this.sparqlList

      this.app.events.resultMetadata.trigger({
        length,
        start,
        end
      })
    } finally {
      this.app.events.fetched.trigger()
    }
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

    const graph = await this.sparqlList.fetchResults(firstNotLoaded, store.state.search.fetchAll)
    const subjects = this.sparqlList.resultSubjects(graph)

    const { start, end } = this.sparqlList || {}
    this.array.splice(firstNotLoaded, subjects.length, ...subjects.map(subject => ({
      graph,
      subject,
      range: { start, end }
    })))

    return this.host.requestUpdate()
  }

  download (filename = 'results') {
    const properties = getProperties(store.state.core.shapes['csv-export-shape'])

    const exported = this.array.reduce((prev, row) => {
      if (!row) return prev
      const { graph, subject } = row

      const ptr = clownface({ dataset: graph, term: subject })
      const csvRow = [...properties.map(({ path }) => `"${findNodes(ptr, path)}"`), `"${ptr.value}"`].join(',')

      return [...prev, csvRow]
    }, [[...properties.map(({ name }) => `"${name}"`), '"ID"'].join(',')])

    download('text/csv', exported.join('\n'), `${filename}.csv`)
  }
}
