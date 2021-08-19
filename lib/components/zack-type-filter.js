import { css, html } from 'lit'
import ColorHash from 'color-hash'
import { namedNode } from '@rdfjs/data-model'
import { ZackComponent } from './ZackComponent'

const colorHash = new ColorHash()

class ZackTypeFilter extends ZackComponent {
  static get styles () {
    return css`
      .type-filter {
        color: white;
        border-color: white;
        border-width: 1px;
        border-radius: 5px;
        border-style: solid;
        line-height: 95%;
        margin: 2px 4px 2px 4px;
        padding: 2px 4px 2px 4px;
        overflow: hidden;
        cursor: pointer;
        font-size: 110%;
        margin-top: 22px;
      }

      .type-filter:hover {
        border-color: #ddd;
        background-color: white;
        color: black;
      }
    `
  }

  static get properties () {
    return {
      predicate: {
        type: Object,
        converter: namedNode
      },
      term: {
        type: Object,
        converter: namedNode
      }
    }
  }

  get color () {
    const { value } = this.term

    return colorHash.hex(value.substring(value.lastIndexOf('/') + 1, value.length))
  }

  render () {
    if (!this.predicate) {
      return ''
    }

    return html`<div style="background-color: ${this.color}" 
                     data-filterable="=" 
                     data-predicate="${this.predicate.value}" 
                     data-value="${this.term.value}" 
                     data-named-node="" class="type-filter" 
                     @click="${this.filter}">
      <slot name="icon"></slot>
      ${this.title}
    </div>`
  }
}

customElements.define('zack-type-filter', ZackTypeFilter)
