import { connect } from '@captaincodeman/rdx'
import '@spectrum-web-components/dialog/sp-dialog-wrapper.js'
import '@spectrum-web-components/textfield/sp-textfield.js'
import { store } from '../store'
import { html, LitElement } from 'lit'

class ZackNotesDialog extends connect(store, LitElement) {
  static get properties () {
    return {
      open: { type: Boolean },
      notes: { type: String },
      subject: { type: String }
    }
  }

  render () {
    return html`
      <sp-dialog-wrapper
        headline="Notes"
        dismissable
        underlay
        .open="${this.open}"
        @close="${store.dispatch.favorites.hideNotes}"
      >
        <sp-textfield multiline 
                      .value="${this.notes}"
                      @change="${e => store.dispatch.favorites.setNote({ subject: this.subject, notes: e.target.value })}">
        </sp-textfield>
      </sp-dialog-wrapper>
    `
  }

  mapState (state) {
    if (!state.favorites.showNotes) {
      return {
        open: false,
        subject: null,
        notes: ' '
      }
    }

    return {
      open: true,
      ...state.favorites.showNotes
    }
  }
}

customElements.define('zack-notes-dialog', ZackNotesDialog)
