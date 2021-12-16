import { LitElement } from 'lit'
import * as $rdf from '@rdf-esm/data-model'

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

    if (!event.zack) {
      return super.connectedCallback()
    }

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
    this.querySelectorAll('script[class=shape]').forEach(script => {
      this.dispatchEvent(new CustomEvent('zack-parse-shape', {
        detail: {
          id: script.id,
          format: script.type,
          serialized: script.text
        },
        bubbles: true,
        composed: true
      }))
    })

    this.querySelectorAll('link[class=shape]').forEach(link => {
      this.dispatchEvent(new CustomEvent('zack-parse-shape', {
        detail: {
          id: link.id,
          format: link.type,
          serialized: fetch(link.href, {
            headers: {
              accept: link.type
            }
          }).then(res => res.text())
        },
        bubbles: true,
        composed: true
      }))
    })
  }
}
