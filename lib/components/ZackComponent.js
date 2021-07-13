import { css, html, LitElement, unsafeCSS } from 'lit'
import $rdf from 'rdf-ext'
import bootstrap from '../style/bootstrap.css'

export class ZackComponent extends LitElement {
  static get properties () {
    return {
      subject: {
        converter: $rdf.namedNode
      }
    }
  }

  static get styles () {
    return css`${unsafeCSS(bootstrap)}`
  }

  connectedCallback () {
    super.connectedCallback()

    const event = {}
    this.dispatchEvent(new CustomEvent('zack-connect', {
      detail: event,
      composed: true
    }))

    this.zackResults = event.zackResults
  }

  render () {
    if (!this.subject) {
      return ''
    }

    const page = this.zackResults.pages.get(this.subject)

    return html`
      ${this._render(page, this.subject)}
    `
  }
}
