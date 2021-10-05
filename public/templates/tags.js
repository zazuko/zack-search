import { sh } from 'https://jspm.dev/@tpluscode/rdf-ns-builders'

export default function ({ html, shape }, { conceptTags }) {
  const predicate = shape
    .out(sh.property)
    .has(sh.name, 'conceptTags')
    .out(sh.path)
    .term

  return html`<div class="result-tags">
      ${(conceptTags?.terms || []).map(tag => html`
        <zack-filter operator="="
             .predicate="${predicate}"
             .value="${tag}"
             class="filterable">${tag.value}</zack-filter>
      `)}
    </div>`
}
