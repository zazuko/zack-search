import { createModel } from '@captaincodeman/rdx'
import produce from 'immer'

export const core = createModel({
  state: {
    toast: {
      open: false,
      message: ''
    }
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
    })
  }
})
