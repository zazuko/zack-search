import { css, html } from 'lit'
import '@lit-labs/virtualizer'
import { connect } from '@captaincodeman/rdx'
import './zack-result'
import { debounce } from 'debounce'
import { ZackComponent } from './ZackComponent'
import { store } from '../store'

class ZackResults extends connect(store, ZackComponent) {
  static get properties () {
    return {
      app: { type: Object },
      results: { type: Array },
      compact: { type: Boolean },
      listSelected: { type: String },
      shapes: { type: Object },
      parts: { type: Array },
      resultStyles: { type: String },
      resultMetadata: { type: Object }
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
    this.exportedParts = []
  }

  async updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      store.dispatch.results.init(this.app)
    }

    if (_changedProperties.has('resultMetadata') && this.resultMetadata) {
      this.list.scrollToIndex(0)
    }

    if (_changedProperties.has('shapes') && this.shapes) {
      this.exportedParts = this.shapes.flatMap(shape => Object.values(shape.parts)).reduce((exported, part) => {
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
                             .shapes="${this.shapes}"
                             part="result"
                             exportparts="fav,compact,${this.exportedParts.join(',')}"
    ></zack-result>`
  }

  listScrolled (e) {
    store.dispatch.results.load(e.first)
  }

  mapState (state) {
    return {
      shapes: state.results.resultShapes,
      results: state.results.array,
      resultMetadata: state.results.resultMetadata,
      compact: state.results.compactView
    }
  }
}

customElements.define('zack-results', ZackResults)
