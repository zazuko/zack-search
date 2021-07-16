import { css, html, LitElement } from 'lit'

class ResultTimeTick extends LitElement {
  static get properties () {
    return {
      offset: { type: String }
    }
  }

  static get styles () {
    return css`
      :host {
        position: relative;
      }
      
      .result-time-tick {
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid #000;
        position: absolute;
        margin-left: -6px;
        z-index: 5000;
      }

      .result-time-tick-hover {
        width: 12px;
        height: 6px;
        border: 0;
        background-color: transparent;
        position: absolute;
        margin-left: -6px;
      }
    `
  }

  render () {
    return html`
      <div style="left: ${this.offset}px;" class="result-time-tick"></div>
      <div style="left: ${this.offset}px;" class="result-time-tick-hover"></div>
    `
  }
}

customElements.define('result-time-tick', ResultTimeTick)
