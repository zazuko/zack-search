import { html, render } from 'lit'

function htmlBody (body, records) {
  const table = html`<ul>
      ${records.map(([record, properties]) => html`<li>
        ${record}
        <ul>
          ${properties.map(values => html`<li>${values}</li>`)}
        </ul>
      </li>`)}
    </ul>`

  const div = document.createElement('div')
  render(html`${body}\n${table}`, div)

  return div.innerHTML
}

function plainBody (body, records) {
  const details = records.map(([record, properties]) => {
    return `${record}\n${properties.map(values => `  - ${values.join(', ')}`).join('\n')}`
  })

  return `${body}\n${details.join('\n')}`
    .replaceAll('\n', '%0D%0A')
}

export function createEmailBody (templateElement, records) {
  const emailTemplate = templateElement.cloneNode(true)

  const preformatted = emailTemplate.querySelector('pre')
  if (preformatted) {
    return plainBody(preformatted.textContent, records)
  }

  return htmlBody(emailTemplate, records)
}
