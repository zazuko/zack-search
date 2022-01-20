import { css, html, LitElement } from 'lit'
import { variable } from '@rdf-esm/data-model'

class ZackQueryOrder extends LitElement {
  static get styles () {
    return css`
      :host {
        cursor: pointer;
      }
      
    :host-context([selected]) span[part=direction]:after {
      content: "▲";
    }
    
    :host-context([selected][descending]) span[part=direction]:after {
      content: "▼";
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

    this.__initialDescending = false

    this.addEventListener('click', this.__onCLick)
    const script = this.querySelector('script')
    if (script) {
      this.patterns = script.textContent
    }
  }

  firstUpdated (_changedProperties) {
    this.__initialDescending = this.descending

    if (this.selected) {
      this.__sort()
    }
  }

  render () {
    return html`<slot></slot><span part="direction"></span>`
  }

  __onCLick () {
    if (this.selected) {
      this.descending = !this.descending
    } else {
      this.descending = this.__initialDescending
    }

    this.__sort()
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
