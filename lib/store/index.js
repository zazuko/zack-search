import { createStore, devtools, persist } from '@captaincodeman/rdx'
import * as models from './models.js'
import compactToggler from './plugins/compactToggle'
import countUpdater from './plugins/countUpdater'
import notifier from './plugins/notifier'
import searchQueryString from './plugins/searchQueryString'

const plugins = {
  compactToggler,
  countUpdater,
  notifier: notifier(),
  searchQueryString
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
