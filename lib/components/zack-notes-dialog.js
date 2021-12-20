import { connect } from '@captaincodeman/rdx'
import '@spectrum-web-components/dialog/sp-dialog-wrapper.js'
import '@spectrum-web-components/textfield/sp-textfield.js'
import { store } from '../store'
import { css, html, LitElement } from 'lit'
import { translate } from 'lit-i18n/src/lit-i18n.js'

class ZackNotesDialog extends connect(store, LitElement) {
  static get properties () {
    return {
      open: { type: Boolean },
      notes: { type: String },
      subject: { type: String }
    }
  }

  static get styles () {
    return css`
      sp-textfield {
        width: 100%;
      }
    `
  }

  render () {
    return html`
      <sp-dialog-wrapper
        headline="${translate('zack-search:zack-notes-dialog.header')}"
        dismissable
        underlay
        .open="${this.open}"
        @close="${store.dispatch.favorites.hideNotes}"
        size="l"
      >
        ${this.notes.map(([list, notes]) => html`
          <sp-field-label for="${list}" required>${list}</sp-field-label>
          <sp-textfield multiline
                        id="${list}"
                        .value="${notes}"
                        @change="${e => store.dispatch.favorites.setNote({ list, subject: this.subject, notes: e.target.value })}">
          </sp-textfield>
        `)}
        
      </sp-dialog-wrapper>
    `
  }

  mapState (state) {
    if (!state.favorites.showNotes) {
      return {
        open: false,
        subject: null,
        notes: []
      }
    }
    const { subject } = state.favorites.showNotes
    const notes = Object.entries(state.favorites.lists)
      .reduce((notes, [listName, list]) => {
        if (list[subject]) {
          return [
            ...notes,
            [listName, list[subject].notes]
          ]
        }

        return notes
      }, [])

    return {
      open: true,
      subject,
      notes
    }
  }
}

customElements.define('zack-notes-dialog', ZackNotesDialog)
