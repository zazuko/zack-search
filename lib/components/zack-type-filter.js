import { css, html } from 'lit'
import ColorHash from 'color-hash'
import { namedNode } from '@rdf-esm/data-model'
import { ZackComponent } from './ZackComponent'
import './zack-filter.js'

const colorHash = new ColorHash()

class ZackTypeFilter extends ZackComponent {
  static get styles () {
    return css`
      zack-filter {
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

      zack-filter:hover {
        border-color: #ddd;
        background-color: white;
        color: black;
      }
    `
  }

  static get properties () {
    return {
      title: { type: String },
      disabled: { type: Boolean, reflect: true },
      operator: { type: String },
      propertyPathPrefix: { type: String, attribute: 'property-path-prefix' },
      propertyPathPostfix: { type: String, attribute: 'property-path-postfix' },
      expression: { type: String },
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

  constructor () {
    super()
    this.operator = '='
  }

  get levelShort () {
    const { value } = this.term
    return value.substring(value.lastIndexOf('/') + 1, value.length)
  }

  get color () {
    return colorHash.hex(this.levelShort)
  }

  render () {
    return html`<zack-filter style="background-color: var(--zack-level-${this.levelShort}-color, ${this.color})" 
                             operator="${this.operator}" 
                             .predicate="${this.predicate}" 
                             .value="${this.term}" 
                             .label="${this.title}"
                             .propertyPathPrefix="${this.propertyPathPrefix}"
                             .propertyPathPostfix="${this.propertyPathPostfix}"
                             .expression="${this.expression}"
                             part="filter"
                             ?disabled="${this.disabled}"
    > 
      <slot name="icon"></slot>
      ${this.title}
    </zack-filter>`
  }
}

customElements.define('zack-type-filter', ZackTypeFilter)
