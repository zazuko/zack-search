import { css, html } from 'lit'
import ColorHash from 'color-hash'
import { ZackComponent } from './ZackComponent'

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

  render () {
    const page = this.graph
    const { subject } = this
    const hierarchy = this.getHierarchy(page, subject)

    let hierarchyString = html``
    let lvl
    for (lvl in hierarchy.slice(0, -1)) {
      const lvlString = hierarchy[lvl].level
      const lvlShort = lvlString.substring(lvlString.lastIndexOf('/') + 1, lvlString.length)
      const lvlColor = colorHash.hex(lvlShort)

      hierarchyString = html`${hierarchyString}
      <li>
        <a data-filterable="="
           data-toggle="tooltip" data-placement="bottom" title="Filter ${lvlShort}: ${hierarchy[lvl].title}"
           data-predicate="${this.app.terms.hasPart.value}"
           data-property-path-prefix="^"
           data-property-path-postfix="+"
           data-label="${lvlShort}: ${hierarchy[lvl].title}"
           data-value="${hierarchy[lvl].subject.value}"
           data-named-node
           @click="${this.filter}" style="background-color: ${lvlColor}"
        > 
          ${hierarchy[lvl].title}
          <span class="result-hierarchy-after" style="border-left-color: ${lvlColor}"> </span>
        </a>
      </li>`
    }

    return html`<ul>${hierarchyString}</ul>`
  }

  getHierarchy (graph, subject) {
    const title = graph.match(subject, this.app.terms.title).toArray().shift()
    const level = graph.match(subject, this.app.terms.level).toArray().shift()
    let titleString

    if (!level) {
      return []
    }

    if (title) {
      titleString = title.object.value
    } else {
      titleString = subject.value
      console.warn('Missing title on ', subject.value)
    }

    let hierarchy = [{
      subject: subject,
      title: titleString,
      level: level.object.value
    }]

    const relation = graph.match(subject, this.app.terms.relation).toArray().shift()

    if (relation) {
      hierarchy = this.getHierarchy(graph, relation.object).concat(hierarchy)
    }

    return hierarchy
  }
}

customElements.define('zack-result-hierarchy', ZackResultHierarchy)
