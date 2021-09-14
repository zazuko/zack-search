import { createStore, devtools, persist } from '@captaincodeman/rdx'
import * as models from './models.js'

export const store = devtools(persist(createStore({
  models
}), {
  persist (state) {
    return {
      favorites: state.favorites
    }
  }
})
)
