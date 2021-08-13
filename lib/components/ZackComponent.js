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
    const event = {}
    this.dispatchEvent(new CustomEvent('zack-connect', {
      detail: event,
      composed: true
    }))

    const setApp = (app) => {
      this.app = app
      super.connectedCallback()
    }

    if (event.zack.app) {
      setApp(event.zack.app)
      return
    }

    event.zack.addEventListener('zack-init', (e) => {
      setApp(e.detail.app)
    })
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
