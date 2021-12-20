import { connect } from '@captaincodeman/rdx'
import '@spectrum-web-components/button/sp-button.js'
import '@spectrum-web-components/dialog/sp-dialog-wrapper.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-delete.js'
import { store } from '../store'
import { css, html, LitElement } from 'lit'
import { translate } from 'lit-i18n/src/lit-i18n.js'

class ZackListsDialog extends connect(store, LitElement) {
  static get properties () {
    return {
      lists: { type: Array },
      listLabels: { type: Array }
    }
  }

  static get styles () {
    return css`
      sp-icon-delete {
        cursor: pointer;
        pointer-events: unset;
      }
    `
  }

  render () {
    return html`<sp-dialog-wrapper headline="${translate('zack-search:zack-lists-dialog.header')}" dismissable underlay>
      ${this.lists.map(list => html`<div>
        ${this.listLabels[list] || list} <sp-icon-delete @click="${this.__delete(list)}"></sp-icon-delete>
      </div>`)}
      <div>
        <sp-textfield placeholder="${translate('zack-search:zack-lists-dialog.new-list-placeholder')}" @change="${e => store.dispatch.favorites.addList({ list: e.target.value })}"></sp-textfield>
        <sp-button size="s" variant="primary" @click="${this.__add}">${translate('zack-search:zack-lists-dialog.add-list')}</sp-button>
      </div>
    </sp-dialog-wrapper>`
  }

  open () {
    this.renderRoot.querySelector('sp-dialog-wrapper').open = true
  }

  __delete (list) {
    return () => store.dispatch.favorites.removeList({ list })
  }

  __add () {
    const texftield = this.renderRoot.querySelector('sp-textfield')
    const list = texftield.value
    texftield.value = ''
    store.dispatch.favorites.addList({ list })
  }

  mapState (state) {
    return {
      lists: Object.keys(state.favorites.lists),
      listLabels: state.favorites.listLabels
    }
  }
}

customElements.define('zack-lists-dialog', ZackListsDialog)
