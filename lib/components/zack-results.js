import { html, LitElement } from 'lit'
import TermMap from '@rdf-esm/term-map'

class ZackResults extends LitElement {
  constructor () {
    super()
    this.pages = new TermMap()
  }

  connectedCallback () {
    super.connectedCallback()
    this.addEventListener('zack-connect', this.__resultConnected.bind(this), { capture: true })
  }

  addPage (subject, graph) {
    this.pages.set(subject, graph)
  }

  createRenderRoot () {
    return this
  }

  render () {
    return html`<slot></slot>`
  }

  __resultConnected (e) {
    e.detail.zackResults = this
  }
}

customElements.define('zack-results', ZackResults)
