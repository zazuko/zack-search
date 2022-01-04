import { css, html, LitElement } from 'lit'
import { variable } from '@rdf-esm/data-model'

class ZackQueryOrder extends LitElement {
  static get styles () {
    return css`
      :host {
        cursor: pointer;
      }
    `
  }

  static get properties () {
    return {
      variable: { type: String, converter: variable },
      selected: { type: Boolean, reflect: true },
      descending: { type: Boolean, reflect: true },
      patterns: { type: String }
    }
  }

  connectedCallback () {
    super.connectedCallback()

    this.addEventListener('click', this.__sort)
    const script = this.querySelector('script')
    if (script) {
      this.patterns = script.textContent
    }
  }

  firstUpdated (_changedProperties) {
    if (this.selected) {
      this.__sort()
    }
  }

  render () {
    return html`<slot></slot>`
  }

  __sort () {
    this.dispatchEvent(new CustomEvent('zack-set-query-order', {
      detail: {
        id: this.id,
        variable: this.variable,
        patterns: this.patterns,
        descending: this.descending
      },
      bubbles: true,
      composed: true
    }))
  }
}

customElements.define('zack-query-order', ZackQueryOrder)
