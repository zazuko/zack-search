import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'
import { sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { namedNode } from '@rdfjs/data-model'

export const favorites = createModel({
  state: {
    lists: {
      Starred: {}
    }
  },
  reducers: {
    addOrOrRemoveSubject: produce((state, { list, subject }) => {
      const item = state.lists[list][subject]

      if (item) {
        delete state.lists[list][subject]
        return
      }

      state.lists[list][subject] = {
        notes: ''
      }
    }),
    removeSubjectFromLists: produce((state, { subject }) => {
      for (const list of Object.values(state.lists)) {
        delete list[subject]
      }
    }),
    showNotes: produce((state, { subject }) => {
      state.showNotes = {
        subject
      }
    }),
    hideNotes: produce((state) => {
      delete state.showNotes
    }),
    setNote: produce((state, { subject, list, notes }) => {
      state.lists[list][subject].notes = notes
    }),
    addList: produce((state, { list }) => {
      if (list && !state.lists[list]) {
        state.lists[list] = {}
      }
    }),
    removeList: produce((state, { list }) => {
      delete state.lists[list]
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      addOrOrRemoveSubject ({ list, subject }) {
        const { lists } = store.getState().favorites
        if (!lists[list][subject]) return

        dispatch.core.showMessage({
          message: 'Starred item',
          action: {
            text: 'Add note',
            callback () {
              dispatch.core.hideMessage()
              dispatch.favorites.showNotes({ subject })
            }
          }
        })
      },
      addListFilter ({ list }) {
        const items = Object.keys(store.getState().favorites.lists[list]).map(namedNode)

        dispatch.search.setFilter({
          id: 'list',
          label: `list: ${list}`,
          list,
          expression: sparql`FILTER ( ?sub ${IN(...items)} )`
        })
      },
      removeListFilter () {
        dispatch.search.removeFilter({ id: 'list' })
      }
    }
  }
})
