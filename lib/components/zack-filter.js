import { connect } from '@captaincodeman/rdx'
import { html, LitElement } from 'lit'
import { namedNode } from '@rdfjs/data-model'
import { store } from '../store'

class ZackFilter extends connect(store, LitElement) {
  static get properties () {
    return {
      operator: { type: String },
      value: { type: Object },
      predicate: { type: Object, converter: namedNode },
      variable: { type: String },
      propertyPathPrefix: { type: String, attribute: 'property-path-prefix' },
      propertyPathPostfix: { type: String, attribute: 'property-path-postfix' },
      label: { type: String },
      namedNode: { type: Boolean }
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
    store.dispatch.search.setFilter({
      id: this.id,
      operator: this.operator,
      value: this.value?.value || '',
      namedNode: this.value?.termType === 'NamedNode',
      termType: this.value.termType,
      predicate: this.predicate?.value || '',
      variable: this.variable,
      propertyPathPrefix: this.propertyPathPrefix,
      propertyPathPostfix: this.propertyPathPostfix,
      label: this.label
    })
  }
}

customElements.define('zack-filter', ZackFilter)
