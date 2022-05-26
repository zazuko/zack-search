function initial () {
  const params = new URLSearchParams(window.location.hash.substring(1))

  return [...params.entries()].reduce((map, [key, value]) => ({ ...map, [key]: value }), {})
}

export default {
  model: {
    state: {
      order: {},
      params: initial()
    },

    reducers: {
      setParameter ({ params, ...state }, { key, value }) {
        return {
          ...state,
          params: {
            ...params,
            [key]: value

          }
        }
      },
      removeParameter ({ params, ...state }, key) {
        const newParams = { ...params }
        delete newParams[key]
        return {
          ...state,
          params: newParams
        }
      },
      memoizeOrder (state, order) {
        return { ...state, order }
      }
    },

    effects (store) {
      const dispatch = store.getDispatch()

      function pushState () {
        const query = new URLSearchParams(store.getState().searchQueryString.params)
        const url = new URL(window.location.href)
        url.hash = query.toString()
        window.history.pushState(null, null, url.toString())
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
            value
          })

          if (search.order && searchQueryString.order.id !== search.order.id) {
            dispatch.searchQueryString.memoizeOrder(search.order)
          }
        },
        'search/clearTextQuery' () {
          const current = store.getState().searchQueryString

          if (current.params.q) {
            dispatch.searchQueryString.removeParameter('q')
          }
        }
      }
    }
  },

  onStore (store) {
    const { dispatch } = store

    function updateSearchParams () {
      const newParams = new URLSearchParams(window.location.hash.substring(1))
      const fullTextSearch = newParams.get('q')
      if (fullTextSearch) {
        dispatch.search.setTextQuery(fullTextSearch)
      } else {
        dispatch.search.clearTextQuery()
      }
    }

    window.addEventListener('popstate', updateSearchParams)

    updateSearchParams()
  }
}
