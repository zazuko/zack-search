import { LitElement } from 'lit'
import $rdf from 'rdf-ext'
import { store } from '../store'

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
    this.__loadShapes()

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

    event.zack.addEventListener('zack-init', function onInit (e) {
      setApp(e.detail.app)
      event.zack.removeEventListener('zack-init', onInit)
    })
  }

  __loadShapes () {
    this.querySelectorAll('[class=shape]').forEach(link => {
      store.dispatch.core.parseShape({
        id: link.id,
        format: link.type,
        serialized: fetch(link.href).then(res => res.text())
      })
    })
  }
}
