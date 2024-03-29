import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'
import debounce from 'debounce'

let counter = 0

export const search = createModel({
  state: {
    textQuery: new URL(location.href).searchParams.get('q') || '',
    filters: {},
    listeners: [],
    fetchAll: false
  },
  reducers: {
    replaceParams: produce((draft, { filters = [], order = {}, q: textQuery = '' }) => {
      draft.textQuery = textQuery
      draft.order = order

      const implicitFilters = Object.values(draft.filters).filter(filter => filter.display === false)
      draft.filters = [...implicitFilters, ...filters].reduce((map, { id, ...filter }) => {
        return {
          ...map,
          [id]: { id, ...filter }
        }
      }, {})
    }),
    setFilter: produce((draft, { variable, ...filter }) => {
      const id = filter.id || `filter${++counter}`
      const current = draft[id] || {}

      draft.filters[id] = {
        ...current,
        ...filter,
        id,
        variable: variable || id
      }
      draft.listFilter = Object.values(draft.filters).find(({ id }) => id === 'list')
    }),
    setOrder: produce((draft, order) => {
      draft.order = order
    }),
    removeFilter: produce((draft, { id }) => {
      delete draft.filters[id]
      draft.listFilter = Object.values(draft.filters).find(({ id }) => id === 'list')
    }),
    addListener: produce((draft, listener) => {
      if (typeof listener === 'function') {
        draft.listeners.push(listener)
      }
    }),
    setTextQuery: produce((draft, textQuery) => {
      if (textQuery.trim() !== '') {
        draft.textQuery = textQuery.replace('"', '').trim()
      } else {
        draft.textQuery = null
      }
    }),
    clearTextQuery: produce(draft => {
      draft.textQuery = ''
    }),
    fetchAllResults: produce((draft, fetchAll) => {
      draft.fetchAll = fetchAll
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    const notifyListeners = debounce(function () {
      const { search: { listeners } } = store.getState()
      for (const listener of listeners) {
        try { listener() } catch (e) { console.warn(e) }
      }
    }, 100)

    const fetchAllWhenFilteredByList = debounce(function () {
      const { listFilter } = store.getState().search
      dispatch.search.fetchAllResults(!!listFilter)
    }, 100)

    function onSearchChanged () {
      notifyListeners()
      fetchAllWhenFilteredByList()
    }

    return {
      setFilter: onSearchChanged,
      setOrder: onSearchChanged,
      removeFilter: onSearchChanged,
      replaceParams: onSearchChanged,
      setTextQuery (value) {
        if (value) {
          notifyListeners()
        } else {
          dispatch.search.clearTextQuery()
        }
      },
      clearTextQuery () {
        notifyListeners()
      }
    }
  }
})
