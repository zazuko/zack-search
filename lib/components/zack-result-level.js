/* global app */
import { css, html } from 'lit'
import ColorHash from 'color-hash'
import { terms } from '../terms'
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

  _render (page, subject) {
    const tf = app.findPlugin('TypeFilter')
    if (!tf) {
      return ''
    }

    const faLevel = tf.options.values

    const levelString = page.match(subject, terms.level).toArray().shift().object.value
    const levelShort = levelString.substring(levelString.lastIndexOf('/') + 1, levelString.length)
    const levelColor = colorHash.hex(levelShort)

    let faIcon = 'question'
    if (levelString in faLevel) {
      faIcon = faLevel[levelString].icon
    }

    return html`
      <style>
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
      </style>
      <div class="vertical-text" data-filterable="="
         data-toggle="tooltip" data-placement="right" title="Filter ${levelShort}: ${this.title}"
         data-predicate="http://purl.org/dc/terms/hasPart"
         data-property-path-prefix="^"
         data-property-path-postfix="+"
         data-label="${levelShort}: ${this.title}"
         data-value="${subject}"
         data-named-node
         onclick="app.search.addFilter(this)" style="background-color: ${levelColor}"><i class="fa ${faIcon}"></i>
      </div>
    `
  }
}

customElements.define('zack-result-level', ZackResultLevel)
