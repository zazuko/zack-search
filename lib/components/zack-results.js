import { css, html } from 'lit'
import '@lit-labs/virtualizer'
import { connect } from '@captaincodeman/rdx'
import { schema } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@rdf-esm/data-model'
import './zack-result'
import { debounce } from 'debounce'
import { ZackComponent } from './ZackComponent'
import { store } from '../store'

const codeLinkTerm = namedNode('https://code.described.at/link')

class ZackResults extends connect(store, ZackComponent) {
  static get properties () {
    return {
      app: { type: Object },
      results: { type: Array },
      compact: { type: Boolean },
      listSelected: { type: String },
      shape: { type: Object },
      parts: { type: Array },
      resultStyles: { type: String }
    }
  }

  static get styles () {
    return css`
      :host {
        display: flex;
        height: 100%;
        overflow: auto;
      }
    
    #iron-list {
      flex: 1;
      height: unset;
    }
    
    zack-result {
       width: 100%
    }`
  }

  constructor () {
    super()
    this.compact = false
    this.parts = []
    this.exportedParts = []
  }

  async updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      store.dispatch.results.init(this.app)
      this.app.events.resultMetadata.on(() => {
        this.list.scrollToIndex(0)
      })
    }

    if (_changedProperties.has('shape') && this.shape) {
      const scParts = this.shape.parts

      this.parts = await Promise.all(scParts
        .map(async (part) => {
          const name = part.out(schema.name).value
          const codeLink = part.out(codeLinkTerm).value
          const children = part.out(schema.hasPart).out(schema.name).values

          if (name && codeLink) {
            const render = (await import(/* webpackIgnore: true */ codeLink)).default

            return {
              name,
              children,
              render (...args) {
                try {
                  return render.call(this, ...args)
                } catch (e) {
                  return html`<pre style="display: none">
${e.message}
${e.stack}
                  </pre>`
                }
              }
            }
          }

          return { }
        }))

      this.exportedParts = this.parts.reduce((exported, part) => {
        return [
          ...exported,
          part.name,
          ...part.children.map(child => `${part.name}-${child}`)
        ]
      }, [])
    }
  }

  render () {
    return html`
      <lit-virtualizer id="iron-list" 
                       @visibilityChanged="${debounce(this.listScrolled.bind(this))}" 
                       .items="${this.results}"
                       .renderItem="${this.__renderResult.bind(this)}">
      </lit-virtualizer>`
  }

  get list () {
    return this.renderRoot.getElementById('iron-list')
  }

  get resultSize () {
    return this.compact ? 47 : 67
  }

  __renderResult (result) {
    return html`<zack-result ?compact="${this.compact}"
                             .subject="${result?.pointer}"
                             .range="${result?.range}"
                             .shape="${this.shape}"
                             .parts="${this.parts}"
                             part="result"
                             exportparts="fav,compact,${this.exportedParts.join(',')}"
    ></zack-result>`
  }

  listScrolled (e) {
    store.dispatch.results.load(e.first)
  }

  mapState (state) {
    return {
      shape: state.results.resultShape,
      results: state.results.array
    }
  }
}

customElements.define('zack-results', ZackResults)
