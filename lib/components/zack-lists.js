import { connect } from '@captaincodeman/rdx'
import { css, html, LitElement } from 'lit'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-edit.js'
import './zack-lists-dialog.js'
import { store } from '../store'
import { translate } from 'lit-i18n/src/lit-i18n.js'

class ZackLists extends connect(store, LitElement) {
  static get properties () {
    return {
      selected: { type: String },
      lists: { type: Array },
      listLabels: { type: Object }
    }
  }

  static get styles () {
    return css`
      sp-icon-edit {
        cursor: pointer;
        pointer-events: unset;
      }
    `
  }

  constructor () {
    super()
    this.lists = []
    this.selected = ''
  }

  render () {
    return html`<select @input="${this.__listFilter}" .value="${this.selected}" part="dropdown">
      <option value="">${translate('zack-search:zack-lists.select-list')}</option>
      ${this.lists.map(list => html`<option value="${list}">${this.listLabels[list] || list}</option>`)}
    </select>
    <sp-icon-edit @click="${this.__editLists}"></sp-icon-edit>
    <zack-lists-dialog></zack-lists-dialog>`
  }

  mapState (state) {
    const selected = state.search.listFilter?.list || ''

    return {
      selected,
      lists: Object.keys(state.favorites.lists),
      listLabels: state.favorites.listLabels
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

  __editLists () {
    this.renderRoot.querySelector('zack-lists-dialog').open()
  }
}

customElements.define('zack-lists', ZackLists)
