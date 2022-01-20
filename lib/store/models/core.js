import { createModel } from '@captaincodeman/rdx'
import produce, { current } from 'immer'
import { parsers } from '@rdf-esm/formats-common'
import toStream from 'string-to-stream'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders/strict'

export const core = createModel({
  state: {
    toast: {
      open: false,
      message: ''
    },
    shapes: {},
    templates: {},
    promises: 0,
    isLoading: false
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
    setShapesGraph: produce((draft, { id, shape }) => {
      draft.shapes[id] = shape
    }),
    addTemplate: produce((draft, { id, body, attributes }) => {
      draft.templates[id] = { body, ...attributes }
    }),
    incrementLoadingCounter: produce((draft) => {
      draft.promises++
      draft.isLoading = current(draft).promises > 0
    }),
    decrementLoadingCounter: produce((draft) => {
      draft.promises -= 1
      draft.isLoading = current(draft).promises > 0
    })
  },
  effects (store) {
    const dispatch = store.getDispatch()

    return {
      async parseShape ({ id, format, serialized }) {
        const quadStream = parsers.import(format, toStream(await serialized))
        if (quadStream) {
          const dataset = await $rdf.dataset().import(quadStream)
          const shape = clownface(({ dataset })).has(rdf.type, sh.NodeShape)
          if (!shape.values.length) {
            console.warn(`No sh:NodeShape found in graph ${id}`)
          }

          dispatch.core.setShapesGraph({ id, shape })
        }
      },
      addLoadingPromise (promise) {
        dispatch.core.incrementLoadingCounter()

        promise.finally(() => {
          dispatch.core.decrementLoadingCounter()
        })
      }
    }
  }
})
