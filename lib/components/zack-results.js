import { css, html } from 'lit'
import { Layout1d } from '@lit-labs/virtualizer'
import { connect } from '@captaincodeman/rdx'
import { schema } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@rdf-esm/data-model'
import './zack-result'
import { debounce } from 'debounce'
import { ResultsController } from '../controller/ResultsController'
import { ZackComponent } from './ZackComponent'
import { store } from '../store'

const codeLinkTerm = namedNode('https://code.described.at/link')

class ZackResults extends connect(store, ZackComponent) {
  static get properties () {
    return {
      app: { type: Object },
      results: { type: Array },
      compact: { type: Boolean },
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
    this.results = new ResultsController(this)
    this.parts = []
    this.exportedParts = []
  }

  async updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      this.results.init()
      this.app.events.resultMetadata.on(() => {
        this.list.scrollToIndex(0)
      })
    }

    if (_changedProperties.has('shape') && this.shape) {
      const scParts = this.shape
        .out(schema.hasPart)
        .toArray()

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
                       .layout="${Layout1d}"
                       @rangeChanged="${debounce(this.listScrolled.bind(this))}" 
                       .items="${this.results.array}"
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
    this.results.load(e.detail.firstVisible)
  }

  mapState (state) {
    return {
      shape: state.core.shapes.result
    }
  }
}

customElements.define('zack-results', ZackResults)
