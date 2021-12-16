import { css, html, LitElement } from 'lit'
import { namedNode } from '@rdf-esm/data-model'

class ZackFilter extends LitElement {
  static get styles () {
    return css`
      :host([disabled]) {
        pointer-events: none;
      }
    `
  }

  static get properties () {
    return {
      operator: { type: String },
      value: { type: Object },
      predicate: { type: Object, converter: namedNode },
      variable: { type: String },
      propertyPathPrefix: { type: String, attribute: 'property-path-prefix' },
      propertyPathPostfix: { type: String, attribute: 'property-path-postfix' },
      label: { type: String },
      expression: { type: String },
      namedNode: { type: Boolean },
      disabled: { type: Boolean, reflect: true }
    }
  }

  connectedCallback () {
    super.connectedCallback()

    this.addEventListener('click', this.__filter)
  }

  render () {
    return html`<slot></slot>`
  }

  __filter () {
    const value = this.value?._context ? this.value.term : this.value

    this.dispatchEvent(new CustomEvent('zack-set-filter', {
      detail: {
        id: this.id,
        operator: this.operator,
        value,
        namedNode: value?.termType === 'NamedNode',
        predicate: this.predicate,
        variable: this.variable,
        propertyPathPrefix: this.propertyPathPrefix,
        propertyPathPostfix: this.propertyPathPostfix,
        label: this.label,
        expression: this.expression
      },
      bubbles: true,
      composed: true
    }))
  }
}

customElements.define('zack-filter', ZackFilter)
