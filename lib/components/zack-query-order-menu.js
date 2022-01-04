import { html, LitElement } from 'lit'

class ZackQueryOrderMenu extends LitElement {
  connectedCallback () {
    super.connectedCallback()

    this.addEventListener('zack-set-query-order', ({ detail: { id } }) => {
      for (const el of this.querySelectorAll('zack-query-order')) {
        el.selected = el.id === id
      }
    })
  }

  render () {
    return html`<slot></slot>`
  }
}

customElements.define('zack-query-order-menu', ZackQueryOrderMenu)
