import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'

let counter = 0

export const search = createModel({
  state: {
    textQuery: new URL(location.href).searchParams.get('q') || '',
    filters: {},
    listeners: []
  },
  reducers: {
    setFilter: produce((draft, { variable, ...filter }) => {
      const id = filter.id || `filter${++counter}`
      const current = draft[id] || {}

      draft.filters[id] = {
        ...current,
        ...filter,
        id,
        variable: variable || id
      }
    }),
    removeFilter: produce((draft, { id }) => {
      delete draft.filters[id]
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
    })
  },
  effects (store) {
    function notifyListeners () {
      const { search: { listeners } } = store.getState()
      for (const listener of listeners) {
        try { listener() } catch (e) { console.warn(e) }
      }
    }

    return {
      setFilter: notifyListeners,
      removeFilter: notifyListeners,
      setTextQuery (value) {
        window.history.replaceState(null, null, value ? '?q=' + value : '')
        notifyListeners()
      },
      clearTextQuery () {
        history.replaceState(null, null, location.pathname)
        notifyListeners()
      }
    }
  }
})
