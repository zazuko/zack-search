import { css, html } from 'lit'
import './zack-result-hierarchy'
import './zack-result-time-tick'
import './zack-result-level'
import { ZackComponent } from './ZackComponent'
import './zack-fav-menu'
import './zack-filter'

class ZackResult extends ZackComponent {
  static get properties () {
    return {
      compact: { type: Boolean, reflect: true },
      range: { type: Object },
      subject: { type: Object }
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
        grid-template-columns: 32px repeat(4, 1fr);
        grid-auto-rows: 19px 23px 23px;
      }
      
      :host([compact]) {
        height: var(--zack-result-internal-compact-height);
      }
      
      :host([compact]) #wrapper {
        grid-auto-rows: 0 var(--zack-result-internal-compact-height) 0;
      }
      
      .fav {
        grid-column: 1;
        grid-row: 2 / 3;
        --spectrum-alias-border-size-thin: 0px;
      }

      .main > div {
        margin-top: 2px;
        margin-left: 30px;
        line-height: 110%;
        height: calc(var(--zack-result-internal-compact-height) - 2px);
        overflow: hidden;
      }

      :host([compact]) .hierarchy ,
      :host([compact]) .tags ,
      :host([compact]) .other ,
      :host([compact]) .thumbnail{
        display: none;
      }

      .main a {
        text-decoration: none;
        color: black;
      }
      
      .hierarchy {
        grid-column: 2 / 6;
        grid-row: 1 / 2;
        overflow: hidden;
      }

      .main {
        height: var(--zack-result-internal-compact-height);
        grid-column: 2;
        grid-row: 2 / 3;
      }

      :host([compact]) .main {
        grid-column: 2 / 5;
      }
      
      .reference {
        grid-column: 4;
        grid-row: 2;
      }

      :host([compact]) .reference {
        grid-column: 5;
      }
      
      .tags {
        grid-column: 4;
        grid-row: 2;
      }
      
      .other {
        grid-column: 4 / 5;
        grid-row: 3;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .thumbnail {
        grid-column: 5;
        grid-row: 1 / 4;
        max-width: 64px;
        overflow: hidden;
      }
      
      .thumbnail img {
        height: 100%;
        position: absolute;
        right: 0
      }

      a {
        color: #2196f3;
        text-decoration: none;
      }
    `
  }

  render () {
    const { subject } = this

    if (!subject) {
      return ''
    }

    let title = subject.out(this.app.terms.title).values.shift()
    if (!title) {
      title = subject.value
      console.log('Not good: Missing title on ', subject.value)
    }

    const titleLink = html`<a target="_blank" href="${subject.value}">${title}</a>`

    const referenceCode = subject.out(this.app.terms.referenceCode).values.shift() ||
      subject.out(this.app.terms.recordID).values.shift()

    const reference = html`<span><i>${referenceCode}</i></span>`

    const conceptTags = subject.dataset.match(subject.term, this.app.terms.conceptTag).toArray()
    const conceptTagDivs = html`<div class="result-tags">
      ${(conceptTags || []).map(tag => html`
        <zack-filter operator="="
             .predicate="${tag.predicate}"
             .value="${tag.object}"
             class="filterable">${tag.object.value}</zack-filter>
      `)}
    </div>`

    const url = subject.out(this.app.terms.isRepresentedBy).values.shift()
    let urlLink = ''
    if (url) {
      urlLink = html`<span><a target="_blank" href="${url}"><i class="fa fa-external-link" title="Link to Archive"></i> </a></span>`
    }

    const description = subject.out(this.app.terms.description).values.shift()
    let descSpan = ''
    if (description) {
      descSpan = html`<span>Description: ${description}</span>`
    } else {
      const note = subject.out(this.app.terms.note).values.shift()
      if (note) {
        descSpan = html`<span>Note: ${note}</span>`
      }
    }

    const physicalForm = subject.out(this.app.terms.physicalForm).values.shift()
    let physical = ''
    if (physicalForm) {
      physical = html`<span>${physicalForm}</span>`
    }

    const { intervalStarts, intervalEnds } = this.app.getResultInterval(subject)

    let timeTick = ''
    let timeRange = ''
    if (intervalStarts) {
      const timelineMargin = 40
      const date = new Date(intervalStarts)
      const range = this.range.end - this.range.start
      const width = document.querySelector('zack-timeline').offsetWidth - timelineMargin
      if (!isNaN(date.valueOf())) {
        const offset = ((width / range) * (date - this.range.start)) + (timelineMargin / 2)
        timeTick = html`<zack-result-time-tick .offset="${offset}"></zack-result-time-tick>`
      }
      let timeR
      const intervalEndDate = new Date(intervalEnds)
      if (intervalEnds && date.getFullYear() !== intervalEndDate.getFullYear()) {
        timeR = html`${date.getFullYear()}-${intervalEndDate.getFullYear()}`
      } else {
        timeR = date.getFullYear()
      }
      timeRange = html`<span> (${timeR})</span>`
    }

    const thumbnailUri = this.app.getThumbnail?.(subject)

    const thumbnail = thumbnailUri ? html`<img src="${thumbnailUri}" alt="${title}">` : ''

    return html`
      <style>
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
      </style>
      <div id="wrapper">
      <div class="fav">
        <zack-fav-menu .subject="${subject}"></zack-fav-menu>
      </div>
      <div class="hierarchy">
        ${timeTick}
        <zack-result-hierarchy .subject="${subject}"></zack-result-hierarchy>
      </div>
      <div class="main">
        <zack-result-level .title="${title}" .subject="${subject}"></zack-result-level>
        <div>${titleLink}</div>
      </div>
      <div class="reference">
        ${reference} ${timeRange}
      </div>
      <div class="tags">${conceptTagDivs}</div>
      <div class="other">${urlLink} ${descSpan} ${physical}</div>
      <div class="thumbnail">${thumbnail}</div>
      </div>
    `
  }
}

customElements.define('zack-result', ZackResult)
