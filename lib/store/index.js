import { createStore, devtools, persist } from '@captaincodeman/rdx'
import * as models from './models.js'
import compactToggler from './plugins/compactToggle'
import countUpdater from './plugins/countUpdater'

const plugins = {
  compactToggler,
  countUpdater
}

export const store = devtools(persist(createStore({
  models,
  plugins
}), {
  persist (state) {
    return {
      favorites: state.favorites
    }
  }
})
)
