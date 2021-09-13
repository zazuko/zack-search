import { css, html, LitElement } from 'lit'
import '@spectrum-web-components/action-menu/sync/sp-action-menu.js'
import '@spectrum-web-components/menu/sp-menu-item.js'
import '@spectrum-web-components/menu/sp-menu-group.js'
import '@spectrum-web-components/textfield/sp-textfield.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-checkmark.js'
import { library, icon } from '@fortawesome/fontawesome-svg-core'
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar.js'
import { faStar as faStarO } from '@fortawesome/free-regular-svg-icons/faStar.js'
import { store } from '../store'
import { connect } from '@captaincodeman/rdx'

library.add(faStar)
library.add(faStarO)
const star = icon({ prefix: 'fas', iconName: 'star' })
const starOutline = icon({ prefix: 'far', iconName: 'star' })

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
          ${this.starred ? star.node : starOutline.node}
        </span>
        <sp-menu-item @click="${this.onListClick('Not starred')}">
          ${(this.listedOn.length ? '' : html`<sp-icon-checkmark slot="icon"></sp-icon-checkmark>`)}
          Not starred
        </sp-menu-item>
        <sp-menu-group>
          <span slot="header">List</span>
          ${this.lists.map(list => html`<sp-menu-item @click="${this.onListClick(list)}">
            ${this.listedOn.includes(list) ? html`<sp-icon-checkmark slot="icon"></sp-icon-checkmark>` : ''}
            ${list}
          </sp-menu-item>`)}
        </sp-menu-group>
        <sp-menu-group ?hidden="${this.listedOn.length === 0}">
          <span slot="header">Notes</span>
          <sp-button quiet variant="primary" @click="${this.addNotes}">Edit notes</sp-button>
        </sp-menu-group>
      </sp-action-menu>
    `
  }

  onListClick (list) {
    return () => this.toggleFavorite(list)
  }

  toggleFavorite (list) {
    if (list === 'Not starred') {
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
