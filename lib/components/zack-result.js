import { css, html } from 'lit'
import { terms } from '../terms'
import renderer from '../renderer'
import { ZackComponent } from './ZackComponent'
import './zack-result-hierarchy'
import './result-time-tick'
import './zack-result-level'

class ZackResult extends ZackComponent {
  static get properties () {
    return {
      graph: { type: Object },
      compact: { type: Boolean, reflect: true }
    }
  }

  static get styles () {
    return css`
      :host {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: auto 23px 23px;
        border-top: 1px dotted black;
        overflow: hidden;
        position: relative;
        padding-left: 15px;
      }
      
      :host([compact]) {
        grid-auto-rows: 0 46px 0;
      }

      .main > div {
        margin-top: 2px;
        margin-left: 30px;
        line-height: 110%;
        height: 42px;
        overflow: hidden;
      }

      :host([compact]) .hierarchy ,
      :host([compact]) .tags ,
      :host([compact]) .other {
        display: none;
      }

      .main a {
        text-decoration: none;
        color: black;
      }
      
      .hierarchy {
        grid-column: 1 / 4;
        grid-row: 1 / 2;
        overflow: hidden;
      }

      .main {
        height: 46px;
        grid-column: 1;
        grid-row: 2 / 3;
      }
      
      .reference {
        grid-column: 2;
        grid-row: 2;
      }
      
      .tags {
        grid-column: 3;
        grid-row: 2;
      }
      
      .other {
        grid-column: 2 / 4;
        grid-row: 3;
      }
    `
  }

  _render (page, subject) {
    const title = page.match(subject, terms.title).toArray().shift()
    let titleString = ''
    if (title) {
      titleString = title.object.value
    } else {
      titleString = subject.value
      console.log('Not good: Missing title on ', subject.value)
    }

    const titleLink = html`<a target="_blank" href="${subject.value}">${titleString}</a>`

    let referenceString = ''
    const referenceCode = page.match(subject, terms.referenceCode).toArray().shift()
    if (referenceCode) {
      referenceString = referenceCode.object.value
    } else {
      const recordId = page.match(subject, terms.recordID).toArray().shift()
      if (recordId) {
        referenceString = recordId.object.value
      }
    }

    const reference = html`<span><i>${referenceString}</i></span>`

    const conceptTags = page.match(subject, terms.conceptTag).toArray()
    const conceptTagDivs = html`<div class="result-tags">
      ${(conceptTags || []).map(tag => html`
        <div data-filterable="="
             data-predicate="${tag.predicate.value}"
             data-value="${tag.object.value}"
             class="filterable" onclick="app.search.addFilter(this)">${tag.object.value}</div>
      `)}
    </div>`

    const url = page.match(subject, terms.isRepresentedBy).toArray().shift()
    let urlLink = ''
    if (url) {
      urlLink = html`<span><a target="_blank" href="${url.object.value}"><i class="fa fa-external-link" title="Link to Archive"></i> </a></span>`
    }

    const description = page.match(subject, terms.description).toArray().shift()
    let descSpan = ''
    if (description) {
      descSpan = html`<span>Description: ${description.object.value}</span>`
    } else {
      const note = page.match(subject, terms.note).toArray().shift()
      if (note) {
        descSpan = html`<span>Note: ${note.object.value}</span>`
      }
    }

    const physicalForm = page.match(subject, terms.physicalForm).toArray().shift()
    let physical = ''
    if (physicalForm) {
      physical = html`<span>${physicalForm.object.value}</span>`
    }

    const intervalStarts = page.match(subject, terms.intervalStarts).toArray().shift()
    const intervalEnds = page.match(subject, terms.intervalEnds).toArray().shift()

    let timeTick = ''
    let timeRange = ''
    if (intervalStarts) {
      const timelineMargin = 40
      const date = new Date(intervalStarts.object.value)
      const range = renderer.end - renderer.start
      const width = document.getElementById('zack-timeline').offsetWidth - timelineMargin
      if (date instanceof Date && !isNaN(date.valueOf())) {
        const offset = ((width / range) * (date - renderer.start)) + (timelineMargin / 2)
        timeTick = html`<result-time-tick .offset="${offset}"></result-time-tick>`
      }
      let timeR
      if (intervalEnds) {
        timeR = html`${new Date(intervalStarts.object.value).getFullYear()}-${new Date(intervalEnds.object.value).getFullYear()}`
      } else {
        timeR = new Date(intervalStarts.object.value).getFullYear()
      }
      timeRange = html`<span> (${timeR})</span>`
    }

    return html`
      <div class="hierarchy">
        ${timeTick}
        <zack-result-hierarchy .subject="${subject}"></zack-result-hierarchy>
      </div>
      <div class="main">
        <zack-result-level .title="${titleString}" .subject="${subject}"></zack-result-level>
        <div>${titleLink}</div>
      </div>
      <div class="reference">
        ${reference} ${timeRange}
      </div>
      <div class="tags">${conceptTagDivs}</div>
      <div class="other">${urlLink} ${descSpan} ${physical}</div>
    `
  }
}

customElements.define('zack-result', ZackResult)
