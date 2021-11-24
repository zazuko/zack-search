import { css, html } from 'lit'
import ColorHash from 'color-hash'
import { findNodes } from 'clownface-shacl-path'
import { ZackComponent } from './ZackComponent'
import './zack-filter'

const colorHash = new ColorHash()

class ZackResultHierarchy extends ZackComponent {
  static get styles () {
    return css`
      :host {
        display: block;
        height: 19px;
        overflow: hidden;
      }
      
      ul {
        list-style: none;
        overflow-x: scroll;
        overflow-y: hidden;
        font-size: 80%;
        height: 39px;
        padding: 0;
        margin: 0;
        display: flex;
      }

      li {
        float: left;
      }

      li:first-child a {
        padding-left: 31px;
      }

      li a {
        color: white;
        text-decoration: none;
        height: 19px;
        padding: 0px 0 0px 50px;
        position: relative;
        display: block;
        cursor: pointer;
        white-space: nowrap;
      }
      
      .filter-title {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
        transition: 0s max-width;
      }

      .filter-title:hover {
        max-width: 500px;
        transition-delay: 500ms;
      }

      li a .result-hierarchy-after {
        content: " ";
        display: block;
        width: 0;
        height: 0;
        border-top: 50px solid transparent; /* Go big on the size, and let overflow hide */
        border-bottom: 50px solid transparent;
        border-left: 30px solid;
        position: absolute;
        top: 50%;
        margin-top: -50px;
        left: 100%;
        z-index: 2;
      }

      li a::before {
        content: " ";
        display: block;
        width: 0;
        height: 0;
        border-top: 50px solid transparent;
        border-bottom: 50px solid transparent;
        border-left: 30px solid white;
        position: absolute;
        top: 50%;
        margin-top: -50px;
        margin-left: 1px;
        left: 100%;
        z-index: 1;
      }
    `
  }

  static get properties () {
    return {
      filterPrefix: { type: String },
      filterPostfix: { type: String },
      filterOperator: { type: String },
      filterExpression: { type: String },
      subject: { type: Object },
      shape: { type: Object }
    }
  }

  render () {
    const hierarchy = this.getHierarchy(this.subject)

    let hierarchyString = html``
    let lvl
    for (lvl in hierarchy.slice(0, -1)) {
      const lvlString = hierarchy[lvl].level
      const lvlShort = lvlString.substring(lvlString.lastIndexOf('/') + 1, lvlString.length)
      const lvlColor = colorHash.hex(lvlShort)

      hierarchyString = html`${hierarchyString}
      <li>
        <zack-filter operator="${this.filterOperator}"
                     .predicate="${this.shape.properties.hasPart.path.term}"
                     property-path-prefix="${this.filterPrefix}"
                     property-path-postfix="${this.filterPostfix}"
                     .expression="${this.filterExpression}"
                     .label="${lvlShort}: ${hierarchy[lvl].title}"
                     .value="${hierarchy[lvl].subject}">
          
        <a data-toggle="tooltip" data-placement="bottom"
           style="background-color: var(--level-${lvlShort}-color, ${lvlColor})"
        > 
          <span class="filter-title" title="${hierarchy[lvl].title}">${hierarchy[lvl].title}</span>
          <span class="result-hierarchy-after" style="border-left-color: var(--level-${lvlShort}-color, ${lvlColor})"> </span>
        </a>
        </zack-filter>
      </li>`
    }

    return html`<ul>${hierarchyString}</ul>`
  }

  getHierarchy (ptr) {
    let title = findNodes(ptr, this.shape.properties.title.path).values.shift()
    const level = findNodes(ptr, this.shape.properties.level.path).values.shift()

    if (!level) {
      return []
    }

    if (!title) {
      title = ptr.value
      console.warn('Missing title on ', ptr.value)
    }

    let hierarchy = [{
      subject: ptr.term,
      title,
      level
    }]

    const relation = findNodes(ptr, this.shape.properties.relation.path).toArray().shift()

    if (relation) {
      hierarchy = this.getHierarchy(relation).concat(hierarchy)
    }

    return hierarchy
  }
}

customElements.define('zack-result-hierarchy', ZackResultHierarchy)
