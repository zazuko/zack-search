import { createStore, persist } from '@captaincodeman/rdx'
import * as models from './models.js'

export const store = persist(createStore({
  models
}), {
  persist (state) {
    return {
      favorites: state.favorites
    }
  }
})
