import { css, html, LitElement } from 'lit'
import { variable } from '@rdf-esm/data-model'
import { sparql } from '@tpluscode/sparql-builder'

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
      patterns: { type: String },
      noOptional: { type: Boolean, attribute: 'no-optional' },
      customExpression: { type: String, attribute: 'custom-expression' }
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
      this.sort()
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

    this.sort()
  }

  sort () {
    let patterns = this.patterns
    if (patterns && !this.noOptional) {
      patterns = sparql`OPTIONAL { ${patterns} }`
    }

    this.dispatchEvent(new CustomEvent('zack-set-query-order', {
      detail: {
        id: this.id,
        variable: this.variable,
        patterns,
        descending: this.descending,
        customExpression: this.customExpression
      },
      bubbles: true,
      composed: true
    }))
  }
}

customElements.define('zack-query-order', ZackQueryOrder)
