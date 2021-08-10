import { html, LitElement } from 'lit'

class ZackSearch extends LitElement {
  static get properties () {
    return {
      app: { type: Object }
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.addEventListener('zack-connect', this.__childConnected.bind(this), { capture: true })
    this.addEventListener('zack-filter', this.__search.bind(this))
    this.addEventListener('zack-html-filters', this.__bindHtmlFilters.bind(this))
  }

  updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      this.querySelector('zack-results').app = this.app
      this.querySelector('zack-timeline').app = this.app

      this.app.events.filterChange.on(() => {
        this.querySelector('zack-results').results.init()
        this.querySelector('zack-timeline')._render()
      })
    }
  }

  render () {
    return html`<slot></slot>`
  }

  __childConnected (e) {
    e.detail.zack = this.app
  }

  async __search (e) {
    this.querySelector('zack-results').results.init()
  }

  __bindHtmlFilters (e) {
    const search = this.app.findPlugin('Search')

    search.addDynamicFilters(e.detail.elements)
  }
}

customElements.define('zack-search', ZackSearch)
