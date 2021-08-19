import { css, html } from 'lit'
import { Layout1d } from '@lit-labs/virtualizer'
import './zack-result'
import { debounce } from 'debounce'
import { ResultsController } from '../controller/ResultsController'
import { ZackComponent } from './ZackComponent'

class ZackResults extends ZackComponent {
  static get properties () {
    return {
      app: { type: Object },
      results: { type: Array },
      compact: { type: Boolean }
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
  }

  updated (_changedProperties) {
    if (_changedProperties.has('app')) {
      this.results.init()
      this.app.events.resultMetadata.on(() => {
        this.list.scrollToIndex(0)
      })
    }
  }

  render () {
    return html`
      <lit-virtualizer id="iron-list" 
                       .layout="${Layout1d}"
                       @rangeChanged="${debounce(this.listScrolled.bind(this))}" 
                       .items="${this.results.array}"
                       .renderItem="${this.__renderResult.bind(this)}">
      </lit-virtualizer>
</iron-list>`
  }

  get list () {
    return this.renderRoot.getElementById('iron-list')
  }

  get resultSize () {
    return this.compact ? 47 : 67
  }

  __renderResult (result, i) {
    return html`<zack-result ?compact="${this.compact}"
                             subject="${result?.subject?.value}"
                             .graph="${result?.graph}"
                             .range="${result?.range}"
    ></zack-result>`
  }

  listScrolled (e) {
    this.results.load(e.detail.firstVisible)
  }
}

customElements.define('zack-results', ZackResults)
