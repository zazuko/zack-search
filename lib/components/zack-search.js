import { css, html, LitElement } from 'lit'
import Zack from '../zack'
import '@spectrum-web-components/theme/theme-light.js'
import '@spectrum-web-components/theme/scale-medium.js'
import '@spectrum-web-components/theme/sp-theme.js'

const Options = Symbol('zack options')

class ZackSearch extends LitElement {
  static get properties () {
    return {
      app: { type: Object }
    }
  }

  static get styles () {
    return css`
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
    super.connectedCallback()
    this.addEventListener('zack-connect', this.__childConnected.bind(this), { capture: true })
    this.addEventListener('zack-html-filters', this.__bindHtmlFilters.bind(this))
  }

  updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      this.app.events.search.on(this.__search.bind(this))
      this.app.events.filterChange.on(() => {
        this.querySelector('zack-timeline')._render()
      })
    }
  }

  render () {
    return html`<sp-theme color="light" scale="medium"><slot></slot></sp-theme>`
  }

  __childConnected (e) {
    e.detail.zack = this
  }

  async __search () {
    this.querySelector('zack-results').results.init()
  }

  __bindHtmlFilters (e) {
    const search = this.app.findPlugin('Search')

    search.addDynamicFilters(e.detail.elements)
  }
}

customElements.define('zack-search', ZackSearch)
