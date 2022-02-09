import { css, html, LitElement } from 'lit'
import { connect } from '@captaincodeman/rdx'
import { store } from '../store'
import debounce from 'debounce'

class ZackQueryInput extends connect(store, LitElement) {
  static get styles () {
    return css`
      slot[name=clear] {
        display: none;
      }
      
      :host([has-value]) slot[name=clear] {
        display: unset;
      }
    `
  }

  static get properties () {
    return {
      value: { type: String },
      hasValue: { type: Boolean, reflect: true, attribute: 'has-value' }
    }
  }

  firstUpdated () {
    const [input] = this.renderRoot.querySelector('slot[name=query]').assignedNodes()
    this.input = input

    input.addEventListener('keyup', debounce(() => {
      this.dispatchEvent(new CustomEvent('zack-set-text-query', {
        bubbles: true,
        composed: true,
        detail: {
          value: input.value
        }
      }))
    }, 250))
  }

  updated (_changedProperties) {
    if (_changedProperties.has('value') && this.input) {
      this.input.value = this.value
    }
  }

  render () {
    return html`
      <slot name="query"></slot>
      <slot name="clear" @click="${() => this.dispatchEvent(new Event('zack-clear-text-query', {
        bubbles: true,
        composed: true
      }))}"></slot>
    `
  }

  mapState (state) {
    const { textQuery } = state.search

    return {
      value: textQuery,
      hasValue: !!textQuery
    }
  }
}

customElements.define('zack-query-input', ZackQueryInput)
