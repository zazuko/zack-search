import { connect } from '@captaincodeman/rdx'
import { html, LitElement } from 'lit'
import { store } from '../store'

class ZackLists extends connect(store, LitElement) {
  static get properties () {
    return {
      selected: { type: String },
      lists: { type: Array }
    }
  }

  constructor () {
    super()
    this.lists = []
    this.selected = ''
  }

  render () {
    return html`<select @input="${this.__listFilter}" .value="${this.selected}">
      <option value="">Select list</option>
      ${this.lists.map(list => html`<option>${list}</option>`)}
    </select>`
  }

  mapState (state) {
    const selected = Object.values(state.search.filters).find(({ id }) => id === 'list')?.list || ''

    return {
      selected,
      lists: state.favorites.lists
    }
  }

  __listFilter (e) {
    const { value } = e.target

    if (!value) {
      store.dispatch.favorites.removeListFilter()
    } else {
      store.dispatch.favorites.addListFilter({ list: value })
    }
  }
}

customElements.define('zack-lists', ZackLists)
