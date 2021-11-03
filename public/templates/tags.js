export default function ({ html, shape }, { conceptTags }) {
  const predicate = shape.conceptTags.path.term

  return html`<div class="result-tags">
      ${(conceptTags?.terms || []).map(tag => html`
        <zack-filter operator="="
             .predicate="${predicate}"
             .value="${tag}"
             class="filterable">${tag.value}</zack-filter>
      `)}
    </div>`
}
