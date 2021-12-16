import { connect } from '@captaincodeman/rdx'
import { html, LitElement } from 'lit'
import { namedNode } from '@rdf-esm/data-model'
import { store } from '../store'

class ZackFilter extends connect(store, LitElement) {
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

    store.dispatch.search.setFilter({
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
    })
  }
}

customElements.define('zack-filter', ZackFilter)
