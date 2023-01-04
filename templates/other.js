export default function ({ html, subject }, { description, note, url, physicalForm }) {
  let physical = ''
  if (physicalForm?.value) {
    physical = html`<span>${physicalForm}</span>`
  }

  let urlLink = ''
  if (url?.value) {
    urlLink = html`<span><a target="_blank" href="${url}"><i class="fa fa-external-link" title="Link to Archive"></i> </a></span>`
  }

  let descSpan = ''
  if (description?.value) {
    descSpan = html`<span>Description: ${description}</span>`
  } else if (note?.value) {
    descSpan = html`<span>Note: ${note}</span>`
  }

  return html`${urlLink} ${descSpan} ${physical}`
}
