import { css, html, LitElement } from 'lit'
import '@spectrum-web-components/action-menu/sync/sp-action-menu.js'
import '@spectrum-web-components/menu/sp-menu-item.js'
import '@spectrum-web-components/menu/sp-menu-group.js'
import '@spectrum-web-components/textfield/sp-textfield.js'
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

  __onMouse () {
    this.renderRoot.querySelector('sp-action-menu').open = true
  }

  render () {
    return html`
      <sp-action-menu selects="single" 
                      .value="${this.listedOn || 'Not starred'}"
                      @change="${this.onChange}"
                      @sp-opened="${this.starWhenOpened}"
      >
        <span slot="icon">
          ${this.starred ? star.node : starOutline.node}
        </span>
        <sp-menu-item>
          Not starred
        </sp-menu-item>
        <sp-menu-group>
          <span slot="header">List</span>
          ${this.lists.map(list => html`<sp-menu-item>${list}</sp-menu-item>`)}
        </sp-menu-group>
      </sp-action-menu>
    `
  }

  starWhenOpened () {
    if (!this.starred) {
      this.addFavorite('Starred')
    }
  }

  onChange (e) {
    this.addFavorite(e.target.value)
  }

  addFavorite (list) {
    if (list === 'Not starred') {
      store.dispatch.favorites.removeSubjectFromLists({ subject: this.subject.value })
    } else {
      store.dispatch.favorites.addSubjectToList({ list, subject: this.subject.value })
    }
  }

  mapState (state) {
    const listedOn = [...Object.entries(state.favorites.listedItems)]
      .find(([list, items]) => items.includes(this.subject.value))
      ?.[0]

    return {
      lists: state.favorites.lists,
      listedOn,
      starred: !!listedOn
    }
  }
}

customElements.define('zack-fav-menu', ZackFavMenu)
