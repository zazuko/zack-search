import { termToString, stringToTerm } from 'rdf-string'
import { sparql } from '@tpluscode/sparql-builder'
import dot from 'dot-object'

function initial () {
  const params = new URLSearchParams(window.location.hash.substring(1))

  return [...params.entries()]
}

function without (prefix) {
  return ([key]) => !key.startsWith(prefix)
}

export default {
  model: {
    state: {
      params: initial()
    },

    reducers: {
      setParameter ({ params, ...state }, { key, value }) {
        return {
          ...state,
          params: [
            ...params.filter(without(key)),
            [key, value]
          ]
        }
      },
      setComplexParameter ({ params, ...state }, { prefix, value }) {
        const param = {
          [prefix]: JSON.parse(JSON.stringify(value, toString))
        }
        const dotted = dot.dot(param)
        const newParams = Object.entries(dotted).filter(([, value]) => !!value)

        return {
          ...state,
          params: [
            ...params.filter(without(prefix)),
            ...newParams
          ]
        }
      },
      removeParameter ({ params, ...state }, removed) {
        return {
          ...state,
          params: params.filter(without(removed))
        }
      }
    },

    effects (store) {
      const dispatch = store.getDispatch()

      let previousState = ''

      function pushState () {
        const query = new URLSearchParams(store.getState().searchQueryString.params)
        const url = new URL(window.location.href)
        url.search = query.toString()
        const state = url.toString()
        if (previousState !== state) {
          previousState = state
          window.history.pushState(state, null, state)
        } else if (previousState === '') {
          window.history.replaceState(state, null, state)
        }
      }

      function updateFiltersQueryParam () {
        const explicitFilters = Object.values(store.getState().search.filters)
          .filter(({ display }) => display !== false)

        if (explicitFilters.length) {
          dispatch.searchQueryString.setComplexParameter({
            prefix: 'filters',
            value: explicitFilters
          })
        } else {
          dispatch.searchQueryString.removeParameter('filters')
        }
      }

      return {
        setParameter: pushState,
        setComplexParameter: pushState,
        removeParameter: pushState,
        'search/setTextQuery' (value) {
          const { searchQueryString } = store.getState()

          if (searchQueryString.q === value) {
            return
          }

          dispatch.searchQueryString.setParameter({ key: 'q', value })
        },
        'search/clearTextQuery' () {
          dispatch.searchQueryString.removeParameter('q')
        },
        'search/setOrder' (order) {
          dispatch.searchQueryString.setComplexParameter({
            prefix: 'order',
            value: order
          })
        },
        'search/setFilter' (filter) {
          if (filter.display !== false) {
            updateFiltersQueryParam()
          }
        },
        'search/removeFilter': updateFiltersQueryParam
      }
    }
  },

  onStore (store) {
    const { dispatch } = store

    function updateSearch (params) {
      const undotted = dot.object(Object.fromEntries(params.entries()))
      const searchParams = JSON.parse(JSON.stringify(undotted), fromString)

      dispatch.search.replaceParams(searchParams)
    }

    function updateSearchParams () {
      const newParams = new URLSearchParams(window.location.search)
      updateSearch(newParams)
    }

    window.addEventListener('popstate', updateSearchParams)

    updateSearchParams()
  }
}

function toString (key, value) {
  if (typeof value === 'object' && 'termType' in value) {
    return { _term: termToString(value) }
  }
  if (typeof value === 'object' && 'strings' in value && 'values' in value) {
    const { strings, values } = value
    return { strings, values }
  }

  return value
}

function fromString (key, value) {
  if (typeof value === 'object' && '_term' in value) {
    return stringToTerm(value._term)
  }
  if (typeof value === 'object' && 'strings' in value && 'values' in value) {
    return sparql(value.strings, ...value.values)
  }

  return value
}
