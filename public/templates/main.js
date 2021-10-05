export default function ({ html, subject }, { title }) {
  return html`<a target="_blank" 
                 href="${subject.value}"
                 style="color: var(--zack-result-main-anchor-color, black); text-decoration: none;"
  >${title?.value}</a>`
}
