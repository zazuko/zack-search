import { css, html } from 'lit'
import ColorHash from 'color-hash'
import { ZackComponent } from './ZackComponent'

const colorHash = new ColorHash()

class ZackResultLevel extends ZackComponent {
  static get properties () {
    return {
      title: { type: String }
    }
  }

  static get styles () {
    return css`
      div {
        width: 20px;
        height: 48px;
        text-align: center;
        color: white;
      }
      
      :host {
        width: 20px;
        height: 100%;
        float: left;
        text-align: center;
        color: white;
        cursor: pointer;
      }
    `
  }

  render () {
    const { subject } = this

    const faLevel = this.app.typeFilters

    const levelString = subject.out(this.app.terms.level).values.shift()
    const levelShort = levelString.substring(levelString.lastIndexOf('/') + 1, levelString.length)
    const levelColor = colorHash.hex(levelShort)

    let faIcon = html`<i class="fa fa-question"></i>`
    if (levelString in faLevel) {
      faIcon = faLevel[levelString].icon.cloneNode()
    }

    return html`
      <style>
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
      </style>
      <zack-filter operator="=" 
         title="Filter ${levelShort}: ${this.title}"
         .predicate="${this.app.terms.hasPart}"
         property-path-prefix="^"
         property-path-postfix="+"
         .label="${levelShort}: ${this.title}"
         .value="${subject}">
        <div data-toggle="tooltip" data-placement="right" class="vertical-text" style="background-color: ${levelColor}">${faIcon}</div>
      </zack-filter>
    `
  }
}

customElements.define('zack-result-level', ZackResultLevel)
