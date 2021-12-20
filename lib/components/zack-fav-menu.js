import { css, html, LitElement } from 'lit'
import '@spectrum-web-components/action-menu/sync/sp-action-menu.js'
import '@spectrum-web-components/menu/sp-menu-item.js'
import '@spectrum-web-components/menu/sp-menu-group.js'
import '@spectrum-web-components/textfield/sp-textfield.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-checkmark.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-star.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-star-outline.js'
import { store } from '../store'
import { connect } from '@captaincodeman/rdx'
import { translate } from 'lit-i18n/src/lit-i18n.js'

const star = html`<sp-icon-star></sp-icon-star>`
const starOutline = html`<sp-icon-star-outline></sp-icon-star-outline>`

class ZackFavMenu extends connect(store, LitElement) {
  static get styles () {
    return css`
      svg {
        width: 16px
      }

      [hidden] {
        display: none;
      }
    `
  }

  static get properties () {
    return {
      starred: { type: Boolean },
      subject: { type: Object },
      listedOn: { type: String },
      lists: { type: Array }
    }
  }

  render () {
    return html`
      <sp-action-menu>
        <span slot="icon">
          ${this.starred ? star : starOutline}
        </span>
        <sp-menu-item @click="${this.onListClick()}">
          ${(this.listedOn.length ? '' : html`<sp-icon-checkmark slot="icon"></sp-icon-checkmark>`)}
          ${translate('zack-search:zack-fav-menu.select-not-starred')}
        </sp-menu-item>
        <sp-menu-group>
          <span slot="header">${translate('zack-search:zack-fav-menu.lists-header')}</span>
          ${this.lists.map(list => html`<sp-menu-item @click="${this.onListClick(list)}">
            ${this.listedOn.includes(list) ? html`<sp-icon-checkmark slot="icon"></sp-icon-checkmark>` : ''}
            ${list}
          </sp-menu-item>`)}
        </sp-menu-group>
        <sp-menu-group ?hidden="${this.listedOn.length === 0}">
          <span slot="header">${translate('zack-search:zack-fav-menu.notes')}</span>
          <sp-button quiet variant="primary" @click="${this.addNotes}">${translate('zack-search:zack-fav-menu.edit-notes')}</sp-button>
        </sp-menu-group>
      </sp-action-menu>
    `
  }

  onListClick (list) {
    return () => this.toggleFavorite(list)
  }

  toggleFavorite (list) {
    if (!list) {
      store.dispatch.favorites.removeSubjectFromLists({ subject: this.subject.value })
    } else {
      store.dispatch.favorites.addOrOrRemoveSubject({ list, subject: this.subject.value })
    }
  }

  addNotes () {
    this.renderRoot.querySelector('sp-action-menu').open = false
    store.dispatch.favorites.showNotes({ subject: this.subject.value })
  }

  mapState (state) {
    const listedOn = Object.entries(state.favorites.lists)
      .filter(([, items]) => !!items[this.subject.value])
      .map(([list]) => list)

    return {
      lists: Object.keys(state.favorites.lists),
      listedOn,
      starred: listedOn.length > 0
    }
  }
}

customElements.define('zack-fav-menu', ZackFavMenu)
