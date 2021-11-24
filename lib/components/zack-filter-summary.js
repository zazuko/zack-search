import { connect } from '@captaincodeman/rdx'
import { store } from '../store'
import { css, html, LitElement } from 'lit'

class ZackFilterSummary extends connect(store, LitElement) {
  static get properties () {
    return {
      filters: { type: Array }
    }
  }

  static get styles () {
    return css`
      .filter-item {
        font-size: 10px;
        background-color: white;
        line-height: 95%;
        margin: 2px 4px 2px 4px;
        padding: 2px 4px 2px 4px;
        border-radius: 5px;
        overflow: hidden;
        float: left;
        cursor: pointer;
      }

      .filter-item:after {
        content: "x";
        margin-left: 5px;
        font-weight: 600;
        color: red;
      }
    `
  }

  constructor () {
    super()
    this.filters = []
  }

  render () {
    return html`${this.filters.map(filter => html`
      <div class="filter-item" part="filter"
           @click="${() => store.dispatch.search.removeFilter(filter)}">
      ${filter.label}
    </div>`)}`
  }

  mapState (state) {
    return {
      filters: Object.values(state.search.filters).filter(filter => filter.display !== false)
    }
  }
}

customElements.define('zack-filter-summary', ZackFilterSummary)
