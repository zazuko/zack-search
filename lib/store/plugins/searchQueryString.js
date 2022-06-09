import { termToString, stringToTerm } from 'rdf-string'
import { sparql } from '@tpluscode/sparql-builder'

function initial () {
  const params = new URLSearchParams(window.location.hash.substring(1))

  return [...params.entries()]
}

function without (removed) {
  return ([key]) => key !== removed
}

export default {
  model: {
    state: {
      order: {},
      params: initial()
    },

    reducers: {
      setParameter ({ params, ...state }, { key, values }) {
        return {
          ...state,
          params: [
            ...params.filter(without(key)),
            ...values.map(value => [key, value])
          ]
        }
      },
      removeParameter ({ params, ...state }, removed) {
        return {
          ...state,
          params: params.filter(without(removed))
        }
      },
      memoizeOrder (state, order) {
        return { ...state, order }
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
          console.log(explicitFilters)
          dispatch.searchQueryString.setParameter({
            key: 'filters',
            values: [JSON.stringify(explicitFilters, toString)]
          })
        } else {
          dispatch.searchQueryString.removeParameter('filters')
        }
      }

      return {
        setParameter: pushState,
        removeParameter: pushState,
        'search/setTextQuery' (value) {
          const { search, searchQueryString } = store.getState()

          if (searchQueryString.q === value) {
            return
          }

          dispatch.searchQueryString.setParameter({
            key: 'q',
            values: [value]
          })

          if (search.order && searchQueryString.order.id !== search.order.id) {
            dispatch.searchQueryString.memoizeOrder(search.order)
          }
        },
        'search/clearTextQuery' () {
          dispatch.searchQueryString.removeParameter('q')
        },
        'search/setOrder' (order) {
          console.log(order)
          dispatch.searchQueryString.setParameter({
            key: 'order',
            values: [JSON.stringify(order, toString)]
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
      const searchParams = { }

      const fullTextSearch = params.get('q')
      if (fullTextSearch) {
        searchParams.textQuery = fullTextSearch
      }

      const order = params.get('order')
      if (order) {
        searchParams.order = JSON.parse(order, fromString)
      }

      const filtersJson = params.get('filters')
      if (filtersJson) {
        searchParams.filters = JSON.parse(filtersJson, fromString)
      }

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
