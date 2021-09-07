import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'
import { sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { namedNode } from '@rdfjs/data-model'

export const favorites = createModel({
  state: {
    lists: [
      'Starred'
    ],
    listedItems: {
    },
    notes: {}
  },
  reducers: {
    addSubjectToList: produce((state, { list, subject }) => {
      const items = state.listedItems[list]
      if (items) {
        items.push(subject)
      } else {
        state.listedItems[list] = [subject]
      }
    }),
    removeSubjectFromLists: produce((state, { subject }) => {
      for (const [, items] of Object.entries(state.listedItems)) {
        const index = items.indexOf(subject)
        if (index !== -1) {
          items.splice(index, 1)
        }
      }

      delete state.notes[subject]
    }),
    showNotes: produce((state, { subject }) => {
      state.showNotes = {
        subject,
        notes: state.notes[subject] || ''
      }
    }),
    hideNotes: produce((state) => {
      delete state.showNotes
    }),
    setNote: produce((state, { subject, notes }) => {
      if (!state.notes) {
        state.notes = {}
      }

      state.notes[subject] = notes
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      addSubjectToList ({ subject }) {
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
        const items = (store.getState().favorites.listedItems[list] || []).map(namedNode)

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
