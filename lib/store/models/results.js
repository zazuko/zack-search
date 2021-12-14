import { createModel } from '@captaincodeman/rdx'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@rdf-esm/data-model'
import { findNodes } from 'clownface-shacl-path'
import clownface from 'clownface'
import { SparqlSearchResultList } from '../../SparqlSearchResult'
import { download } from '../../download'
import produce from 'immer'
import { getProperties } from '../../shapes'
import { createEmailBody } from '../../order'

export const results = createModel({
  state: {
    array: []
  },
  reducers: {
    setBaseState (state, { app, sparqlList }) {
      return {
        ...state,
        app,
        sparqlList
      }
    },
    resetArray (state, length) {
      return {
        ...state,
        array: new Array(length)
      }
    },
    prepareBatch: produce((state, { firstNotLoaded, pageSize }) => {
      state.array.splice(firstNotLoaded, pageSize, ...new Array(pageSize).map(() => ({})))
    }),
    populateBatch: produce((state, { firstNotLoaded, subjects, graph }) => {
      const { start, end } = state.sparqlList
      state.array.splice(firstNotLoaded, subjects.length, ...subjects.map(subject => ({
        pointer: graph.node(subject),
        range: { start, end }
      })))
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      async init (zackSearch) {
        let {
          results: { app, sparqlList },
          search
        } = store.getState()

        function loadFromZero ({ length }) {
          dispatch.results.resetArray(length)
          dispatch.results.load(0)
        }

        if (!app) {
          if (!zackSearch) return

          app = zackSearch

          sparqlList = new SparqlSearchResultList({
            endpointUrl: app.getFullEndpointUrl(app.options.endpointUrl),
            pageSize: app.options.resultList.pageSize,
            preload: app.options.resultList.preload,
            resultTypes: app.options.resultTypes
          })

          dispatch.results.setBaseState({ app: zackSearch, sparqlList })

          dispatch.search.setFilter({
            id: 'resultTypes',
            operator: 'IN',
            predicate: rdf.type,
            termType: 'NamedNode',
            variable: 'resultType',
            value: app.options.resultTypes.map(namedNode),
            display: false
          })

          sparqlList.buildMetadataFilterQuery = app.queryBuilder.createBuilder(app.getQuery(app.options.endpointUrl, 'count'))
          sparqlList.buildResultFilterQuery = app.queryBuilder.createBuilder(app.getQuery(app.options.endpointUrl, 'search'))

          app.events.resultMetadata.off(loadFromZero)
          app.events.resultMetadata.on(loadFromZero)
        }

        try {
          app.queryBuilder.setParts({
            textmatch: search.textQuery ? app.getQuery(app.options.endpointUrl, 'textmatch') : null
          })

          app.events.fetching.trigger()
          const length = await sparqlList.fetchResultLength()
          const { start, end } = sparqlList

          app.events.resultMetadata.trigger({
            length,
            start,
            end
          })
        } finally {
          app.events.fetched.trigger()
        }
      },
      async load (from = 0) {
        const {
          results: { array, app, sparqlList },
          search: { fetchAll }
        } = store.getState()

        let firstNotLoaded
        const pageSize = app.options.resultList.pageSize
        for (let i = from; i < from + pageSize; i++) {
          if (!array[i]) {
            firstNotLoaded = i
            break
          }
        }

        if (typeof firstNotLoaded === 'undefined') {
          return
        }

        dispatch.results.prepareBatch({ firstNotLoaded, pageSize })

        const dataset = await sparqlList.fetchResults(firstNotLoaded, fetchAll)
        const subjects = sparqlList.resultSubjects(dataset)

        const graph = clownface({ dataset })
        dispatch.results.populateBatch({ firstNotLoaded, subjects, graph })
      },
      download (filename = 'results') {
        const {
          results: { array },
          core: { shapes }
        } = store.getState()

        const properties = getProperties(shapes['csv-export-shape'])

        const exported = array.reduce((prev, row) => {
          if (!row) return prev
          const csvRow = [...properties.map(({ path }) => `"${findNodes(row.pointer, path)}"`), `"${row.pointer.value || ''}"`].join(',')

          return [...prev, csvRow]
        }, [[...properties.map(({ name }, index) => `"${name || `COLUMN ${index + 1}`}"`), '"Permalink"'].join(',')])

        download('text/csv', exported.join('\n'), `${filename}.csv`)
      },
      order () {
        const {
          results: { array },
          core: { templates, shapes }
        } = store.getState()

        const email = templates['records-order']
        if (!email) {
          return alert('Missing template[id=records-order]')
        }

        const properties = getProperties(shapes['order-shape'])

        const records = array
          .filter(row => !!row)
          .map(({ pointer }) => [
            pointer.value,
            properties.map(({ path }) => findNodes(pointer, path).values)
          ])

        location.href = `mailto:${email.to}?body=${createEmailBody(email.body, records)}&subject=${email.subject}`
      }
    }
  }
})
