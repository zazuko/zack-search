import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'
import { sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { namedNode } from '@rdf-esm/data-model'
import i18next from 'i18next'

export const favorites = createModel({
  state: {
    lists: {
      Starred: {}
    },
    listLabels: {}
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
        state.lists[list] = {
          label: list
        }
      }
    }),
    removeList: produce((state, { list }) => {
      delete state.lists[list]
    }),
    setListLabel: produce((state, { list, label }) => {
      if (!state.listLabels) {
        state.listLabels = {}
      }

      if (list && label) {
        state.listLabels[list] = label
      }
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      addOrOrRemoveSubject ({ list, subject }) {
        const { lists } = store.getState().favorites
        if (!lists[list][subject]) return

        dispatch.core.showMessage({
          message: i18next.t('zack-search:zack-starred-dialog.item-starred'),
          action: {
            text: i18next.t('zack-search:zack-starred-dialog.add-note'),
            callback () {
              dispatch.core.hideMessage()
              dispatch.favorites.showNotes({ subject })
            }
          }
        })
      },
      addListFilter ({ list }) {
        const { lists, listLabels } = store.getState().favorites
        const items = Object.keys(lists[list]).map(namedNode)
        const label = listLabels[list] || list

        dispatch.search.setFilter({
          id: 'list',
          label: `${i18next.t('zack-search:zack-filter-summary.list-prefix')}: ${label}`,
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
