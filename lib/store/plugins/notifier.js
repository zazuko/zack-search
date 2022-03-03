export default () => {
  let store

  function notifyFilters () {
    store.dispatchEvent(new CustomEvent('filters-changed', {
      detail: {
        filters: store.state.search.filters
      }
    }))
  }

  return {
    onStore (_store) {
      store = _store
    },
    model: {
      effects () {
        return {
          'search/removeFilter': notifyFilters,
          'search/setFilter': notifyFilters
        }
      }
    }
  }
}
