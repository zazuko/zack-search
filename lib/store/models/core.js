import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'
import { parsers } from '@rdf-esm/formats-common'
import toStream from 'string-to-stream'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { sh } from '@tpluscode/rdf-ns-builders/strict'

export const core = createModel({
  state: {
    toast: {
      open: false,
      message: ''
    },
    shapes: {}
  },
  reducers: {
    hideMessage: produce((state) => {
      state.toast.open = false
      delete state.toast.message
      delete state.toast.action
    }),
    showMessage: produce((state, { message, action }) => {
      state.toast = {
        open: true,
        message,
        action
      }
    }),
    setShape: produce((draft, { id, shape }) => {
      draft.shapes[id] = shape
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      async parseShape ({ id, format, serialized }) {
        const quadStream = parsers.import(format, toStream(await serialized))
        if (quadStream) {
          const dataset = await $rdf.dataset().import(quadStream)
          const [shape] = clownface(({ dataset })).has(sh.property).toArray()
          dispatch.core.setShape({ id, shape })
        }
      }
    }
  }
})
