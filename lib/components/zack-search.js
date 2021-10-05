import { css, html } from 'lit'
import Zack from '../zack'
import '@spectrum-web-components/theme/theme-light.js'
import '@spectrum-web-components/theme/scale-medium.js'
import '@spectrum-web-components/theme/sp-theme.js'
import '@spectrum-web-components/button/sp-button.js'
import '@spectrum-web-components/toast/sp-toast.js'
import './zack-notes-dialog'
import { connect } from '@captaincodeman/rdx'
import { store } from '../store'
import { ZackComponent } from './ZackComponent'

const Options = Symbol('zack options')

class ZackSearch extends connect(store, ZackComponent) {
  static get properties () {
    return {
      app: { type: Object },
      toast: { type: Object },
      notes: { type: Object }
    }
  }

  static get styles () {
    return css`
      #toast-wrap {
        position: relative;
      }

      sp-toast {
        position: absolute;
        top: 12px;
        right: 0;
        left: 0;
        margin: auto;
        z-index: 1;
        max-width: 500px;
      }
      
      sp-theme {
        --spectrum-alias-font-size-default: 13px;
        --spectrum-alias-body-text-font-family: unset;
      }
    `
  }

  get options () {
    return this[Options]
  }

  set options (options) {
    if (!this[Options]) {
      this[Options] = options
      this.app = new Zack(options)
      this.app.init()
        .then(() => {
          this.dispatchEvent(new CustomEvent('zack-init', {
            detail: {
              app: this.app
            }
          }))
        })
        .catch(function (err) {
          console.error(err)
        })
    }
  }

  connectedCallback () {
    this.addEventListener('zack-connect', this.__childConnected.bind(this), { capture: true })
    super.connectedCallback()

    store.dispatch.search.addListener(() => {
      this.querySelector('zack-results').results.init()
    })
  }

  render () {
    return html`<sp-theme color="light" scale="medium">
      <div id="toast-wrap">
        <sp-toast .open="${this.toast.open}" timeout="1000" variant="info" @close="${store.dispatch.core.hideMessage}">
          ${this.toast.message}
          ${this.__renderToastActionButton()}
        </sp-toast>
      </div>

      <zack-notes-dialog></zack-notes-dialog>
      
      <slot></slot>
    </sp-theme>`
  }

  __renderToastActionButton () {
    if (!this.toast.action) {
      return ''
    }

    return html`
      <sp-button slot="action" variant="overBackground" quiet @click="${this.toast.action.callback}">
        ${this.toast.action.text}
      </sp-button>
    `
  }

  __childConnected (e) {
    e.detail.zack = this
  }

  mapState (state) {
    return {
      toast: state.core.toast
    }
  }
}

customElements.define('zack-search', ZackSearch)
