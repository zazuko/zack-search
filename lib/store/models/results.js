import { createModel } from '@captaincodeman/rdx'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@rdf-esm/data-model'
import { findNodes } from 'clownface-shacl-path'
import clownface from 'clownface'
import { SparqlSearchResultList } from '../../SparqlSearchResult'
import { download } from '../../download'
import produce from 'immer'
import { getFromShapeHierarchy, getProperties } from '../../shapes'
import { createEmailBody } from '../../order'
import { html } from 'lit'

const codeLinkTerm = namedNode('https://code.described.at/link')

export const results = createModel({
  state: {
    array: [],
    compactView: false
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
    }),
    setShapes (state, resultShapes) {
      return { ...state, resultShapes }
    },
    setResultMetadata (state, resultMetadata) {
      return { ...state, resultMetadata }
    },
    setCompactView (state, compactView) {
      return { ...state, compactView }
    }
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      async init (zackSearch) {
        let {
          results: { app, sparqlList },
          search
        } = store.getState()

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
        }

        app.queryBuilder.setParts({
          textmatch: search.textQuery ? app.getQuery(app.options.endpointUrl, 'textmatch') : null
        })

        const promise = sparqlList.fetchResultLength()
        dispatch.core.addLoadingPromise(promise)
        const length = await promise
        const { start, end } = sparqlList

        dispatch.results.setResultMetadata({
          length,
          start,
          end
        })
      },
      setResultMetadata ({ length }) {
        dispatch.results.resetArray(length)
        dispatch.results.load(0)
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

        const promise = sparqlList.fetchResults(firstNotLoaded, fetchAll)
        dispatch.core.addLoadingPromise(promise)
        const dataset = await promise
        const subjects = sparqlList.resultSubjects(dataset)

        const graph = clownface({ dataset })
        dispatch.results.populateBatch({ firstNotLoaded, subjects, graph })
      },
      download (filename = 'results') {
        const {
          results: { array },
          core: { shapes },
          search: { listFilter }
        } = store.getState()

        if (!listFilter) {
          console.warn('List must be selected for exporting')
          return
        }

        const properties = getProperties(shapes['csv-export-shape'])

        const exported = array.reduce((prev, row) => {
          if (!row) return prev
          const csvRow = [...properties.map(({ path }) => `"${findNodes(row.pointer, path)}"`), `"${row.pointer.value || ''}"`].join(',')

          return [...prev, csvRow]
        }, [[...properties.map(({ name }, index) => `"${name || `COLUMN ${index + 1}`}"`), '"Permalink"'].join(',')])

        download('text/csv', exported.join('\n'), `${filename}.csv`)
      },
      order (filter = () => true) {
        const {
          results: { array },
          core: { templates, shapes },
          search: { listFilter }
        } = store.getState()

        if (!listFilter) {
          console.warn('List must be selected for ordering')
          return
        }

        const email = templates['records-order']
        if (!email) {
          return alert('Missing template[id=records-order]')
        }

        const properties = getProperties(shapes['order-shape'])

        const records = array
          .filter(row => !!row)
          .filter(filter)
          .map(({ pointer }) => [
            pointer.value,
            properties.map(({ path }) => findNodes(pointer, path).values)
          ])

        location.href = `mailto:${email.to}?body=${createEmailBody(email.body, records)}&subject=${email.subject}`
      },
      'core/setShapesGraph': async ({ id, shape: graph }) => {
        if (id !== 'result') {
          return
        }

        const shapes = graph.has(sh.targetClass).toArray().map(async shape => {
          const shProperties = findNodes(shape, getFromShapeHierarchy(sh.property)).toArray()
          const schemaParts = findNodes(shape, getFromShapeHierarchy(schema.hasPart)).toArray()

          const properties = shProperties
            .reduce((result, prop) => {
              const name = prop.out(sh.name).value
              const path = prop.out(sh.path)

              if (name) {
                return {
                  ...result,
                  [name]: {
                    pointer: prop,
                    path,
                    findNodes (pointer) {
                      return findNodes(pointer, path)
                    }
                  }
                }
              }

              return result
            }, {})

          const parts = await schemaParts
            .reduce(async (previous, part) => {
              const parts = await previous

              const name = part.out(schema.name).value
              const codeLink = part.out(codeLinkTerm).value
              const children = part.out(schema.hasPart).out(schema.name).values

              if (name && codeLink) {
                const render = (await import(/* webpackIgnore: true */ codeLink)).default

                return {
                  ...parts,
                  [name]: {
                    name,
                    children,
                    render (...args) {
                      try {
                        return render.call(this, ...args)
                      } catch (e) {
                        return html`<pre style="display: none">
${e.message}
${e.stack}
                  </pre>`
                      }
                    }
                  }
                }
              }

              return parts
            }, {})

          return {
            pointer: shape,
            properties,
            parts
          }
        })

        dispatch.results.setShapes(await Promise.all(shapes))
      }
    }
  }
})
