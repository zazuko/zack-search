import { ZackComponent } from './ZackComponent'
import { css, html } from 'lit'
import { namedNode } from '@rdf-esm/data-model'
import './zack-type-filter'

class ZackTypeFilters extends ZackComponent {
  static get styles () {
    return css`
      :host {
        display: flex;
        justify-content: flex-end;
      }
    `
  }

  static get properties () {
    return {
      predicate: { type: Object, converter: namedNode }
    }
  }

  firstUpdated () {
    this.__setPredicate()
  }

  updated (_changedProperties) {
    if (_changedProperties.has('predicate')) {
      this.__setPredicate()
    }
  }

  render () {
    return html`<slot></slot>`
  }

  __setPredicate () {
    const filters = this.querySelectorAll('zack-type-filter')

    for (const filter of filters) {
      filter.predicate = this.predicate
    }
  }
}

customElements.define('zack-type-filters', ZackTypeFilters)
