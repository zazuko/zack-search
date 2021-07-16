import { LitElement } from 'lit'
import $rdf from 'rdf-ext'

export class ZackComponent extends LitElement {
  static get properties () {
    return {
      subject: {
        converter: $rdf.namedNode
      }
    }
  }

  connectedCallback () {
    super.connectedCallback()

    const event = {}
    this.dispatchEvent(new CustomEvent('zack-connect', {
      detail: event,
      composed: true
    }))

    this.app = event.zack
  }

  filter (e) {
    this._filter(e.target)
  }

  async _filter (target) {
    await this.app.search.addFilter(target)
    this.dispatchEvent(new CustomEvent('zack-filter', {
      composed: true,
      bubbles: true
    }))
  }
}
