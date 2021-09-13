import { connect } from '@captaincodeman/rdx'
import '@spectrum-web-components/button/sp-button.js'
import '@spectrum-web-components/dialog/sp-dialog-wrapper.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-delete.js'
import { store } from '../store'
import { css, html, LitElement } from 'lit'

class ZackListsDialog extends connect(store, LitElement) {
  static get properties () {
    return {
      lists: { type: Array }
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
    return html`<sp-dialog-wrapper headline="Lists" dismissable underlay>
      ${this.lists.map(list => html`<div>
        ${list} <sp-icon-delete @click="${this.__delete(list)}"></sp-icon-delete>
      </div>`)}
      <div>
        <sp-textfield placeholder="New list" @change="${e => store.dispatch.favorites.setNote({ list, subject: this.subject, notes: e.target.value })}"></sp-textfield>
        <sp-button size="s" variant="primary" @click="${this.__add}">Add list</sp-button>
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
      lists: Object.keys(state.favorites.lists)
    }
  }
}

customElements.define('zack-lists-dialog', ZackListsDialog)
