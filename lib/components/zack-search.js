import { css, html } from 'lit'
import i18next from 'i18next'
import Zack from '../zack'
import '@spectrum-web-components/theme/theme-light.js'
import '@spectrum-web-components/theme/scale-medium.js'
import '@spectrum-web-components/theme/sp-theme.js'
import '@spectrum-web-components/button/sp-button.js'
import '@spectrum-web-components/toast/sp-toast.js'
import './zack-notes-dialog'
import { connect } from '@captaincodeman/rdx'
import { store } from '../store'
import { ZackComponent } from './ZackComponent'
import defaultTranslations from '../i18n/en'

const Options = Symbol('zack options')

class ZackSearch extends connect(store, ZackComponent) {
  static get properties () {
    return {
      app: { type: Object },
      toast: { type: Object },
      notes: { type: Object },
      loading: { type: Boolean, reflect: true },
      listSelected: { type: Boolean, reflect: true, attribute: 'list-selected' },
      fullTextSearch: { type: Boolean, reflect: true, attribute: 'full-text-search' }
    }
  }

  static get styles () {
    return css`
      #toast-wrap {
        position: relative;
      }

      sp-toast {
        position: absolute;
        top: 12px;
        right: 0;
        left: 0;
        margin: auto;
        z-index: 1;
        max-width: 500px;
      }
      
      sp-theme {
        --spectrum-alias-font-size-default: 13px;
        --spectrum-alias-body-text-font-family: unset;
      }
    `
  }

  get options () {
    return this[Options]
  }

  set options (options) {
    if (!this[Options]) {
      this[Options] = options
      this.app = new Zack(options)
      i18next.addResourceBundle('en', 'zack-search', defaultTranslations, true)
      store.dispatch.favorites.setListLabel({
        list: 'Starred',
        label: i18next.t('zack-search:zack-lists.default-list')
      })
      this.app.init()
        .then(() => {
          this.dispatchEvent(new CustomEvent('zack-init', {
            detail: {
              app: this.app
            }
          }))
        })
        .catch(function (err) {
          console.error(err)
        })
    }
  }

  connectedCallback () {
    this.addEventListener('zack-connect', this.__childConnected.bind(this), { capture: true })

    super.connectedCallback()
    this.__loadTemplates()

    store.dispatch.search.addListener(() => {
      store.dispatch.results.init(this.app)
    })

    const forwardEvent = ({ type, detail }) => { this.dispatchEvent(new CustomEvent(type, { detail })) }
    store.addEventListener('filters-changed', forwardEvent)

    this.__initOrderElements()
  }

  render () {
    return html`<sp-theme color="light" scale="medium">
      <div id="toast-wrap">
        <sp-toast .open="${this.toast.open}" timeout="1000" variant="info" @close="${store.dispatch.core.hideMessage}">
          ${this.toast.message}
          ${this.__renderToastActionButton()}
        </sp-toast>
      </div>

      <zack-notes-dialog></zack-notes-dialog>
      
      <slot></slot>
    </sp-theme>`
  }

  __initOrderElements () {
    const { orderBy, orderDesc } = store.state.searchQueryString.params

    if (orderBy) {
      const order = this.querySelector(`zack-query-order[id=${orderBy}]`)
      // offsetParent == null means that element is not visible
      // will not use invisible element for sorting
      if (order && order.offsetParent) {
        for (const orderElement of this.querySelectorAll('zack-query-order')) {
          orderElement.selected = false
        }

        order.selected = true
        order.descending = orderDesc === 'true'
      }
    }
  }

  __renderToastActionButton () {
    if (!this.toast.action) {
      return ''
    }

    return html`
      <sp-button slot="action" variant="overBackground" quiet @click="${this.toast.action.callback}">
        ${this.toast.action.text}
      </sp-button>
    `
  }

  __childConnected (e) {
    e.detail.zack = this
  }

  __loadTemplates () {
    this.querySelectorAll('template[id]').forEach(template => {
      const attributes = template.getAttributeNames()
        .filter(attr => attr.startsWith('data-'))
        .reduce((previous, attr) => {
          const key = attr.replace(/^data-/, '')
          const value = template.getAttribute(attr)

          return {
            ...previous,
            [key]: value
          }
        }, {})

      store.dispatch.core.addTemplate({
        id: template.id,
        body: template.content,
        attributes
      })
    })
  }

  mapState (state) {
    return {
      toast: state.core.toast,
      listSelected: !!state.search.listFilter?.list,
      loading: state.core.isLoading,
      fullTextSearch: !!state.search.textQuery
    }
  }

  mapEvents () {
    return {
      'zack-download-results': () => store.dispatch.results.download(),
      'zack-order-results': (e) => store.dispatch.results.order(e.detail?.filter),
      'zack-parse-shape': ({ detail }) => store.dispatch.core.parseShape(detail),
      'zack-set-filter': ({ detail }) => store.dispatch.search.setFilter(detail),
      'zack-set-query-order': ({ detail }) => store.dispatch.search.setOrder(detail),
      'zack-set-text-query': ({ detail }) => store.dispatch.search.setTextQuery(detail.value),
      'zack-clear-text-query': () => store.dispatch.search.clearTextQuery()
    }
  }
}

customElements.define('zack-search', ZackSearch)
