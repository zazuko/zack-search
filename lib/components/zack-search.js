import { html, LitElement } from 'lit'
import Zack from '../zack'

const Options = Symbol('zack options')

class ZackSearch extends LitElement {
  static get properties () {
    return {
      app: { type: Object }
    }
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
    return html`<slot></slot>`
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
