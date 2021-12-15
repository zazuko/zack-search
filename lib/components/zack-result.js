import { css, html } from 'lit'
import './zack-result-hierarchy'
import './zack-result-time-tick'
import { ZackComponent } from './ZackComponent'
import './zack-fav-menu'
import './zack-filter'

class ZackResult extends ZackComponent {
  static get properties () {
    return {
      compact: { type: Boolean, reflect: true },
      range: { type: Object },
      subject: { type: Object },
      shape: { type: Object },
      properties: { type: Object },
      parts: { type: Array }
    }
  }

  static get styles () {
    return css`
      :host {
        display: block;
        border-top: 1px dotted black;
        height: 67px;
        --zack-result-internal-compact-height: var(--zack-result-compact-height, 48px)
      }
      
      #wrapper {
        display: grid;
        grid-template-columns: var(--zack-result-columns, 32px 20px repeat(4, 1fr) var(--zack-result-thumbnail-width, 64px));
        grid-auto-rows: var(--zack-result-rows, 19px 23px 23px);
      }
      
      :host([compact]) {
        height: var(--zack-result-internal-compact-height);
      }
      
      :host([compact]) #wrapper {
        grid-auto-rows: 0 var(--zack-result-internal-compact-height) 0;
      }
      
      [part=fav] {
        grid-column: var(--zack-result-fav-grid-column, 1);
        grid-row: var(--zack-result-fav-grid-row, 2 / 3);
        --spectrum-alias-border-size-thin: 0px;
      }

      a {
        color: #2196f3;
        text-decoration: none;
      }
    `
  }

  constructor () {
    super()
    this.parts = []
    this.properties = {}
  }

  async updated (_changedProperties) {
    if ((_changedProperties.has('shape') || _changedProperties.has('subject')) && this.subject && this.shape) {
      this.properties = [...Object.entries(this.shape.properties)]
        .reduce((result, [name, { findNodes }]) => {
          if (name) {
            return {
              ...result,
              [name]: findNodes(this.subject)
            }
          }

          return result
        }, {})
    }
  }

  render () {
    const { subject } = this

    if (!subject || !this.shape) {
      return ''
    }

    const partContext = {
      html,
      subject,
      shape: this.shape
    }

    return html`
      <style>
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
      </style>
      <div id="wrapper">
      <div part="fav">
        <zack-fav-menu .subject="${subject}"></zack-fav-menu>
      </div>
        
      ${this.parts.map(part => html`<div part="${this.compact ? 'compact' : ''} ${part.name}">
        ${part.render.call(this, partContext, this.properties)}
      </div>`)}  
    `
  }
}

customElements.define('zack-result', ZackResult)
