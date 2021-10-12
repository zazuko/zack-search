import { dcterms } from 'https://jspm.dev/@tpluscode/rdf-ns-builders'

export function getParts ({ html }, { level }) {
  const levelShort = level.value.substring(level.value.lastIndexOf('/') + 1, level.value.length)
  const zackSearch = document.querySelector('zack-search')

  let levelColor = 'red'

  let faIcon = html`<i class="fa fa-question"></i>`
  const levelFilter = zackSearch.querySelector(`zack-type-filter[term="${level}"]`)
  if (levelFilter) {
    faIcon = levelFilter.querySelector('i').cloneNode()
    levelColor = levelFilter.color
  }

  return { faIcon, levelShort, levelColor }
}

export function renderFilter (
  { operator = '=', prefix = '^', postfix = '+', predicate = dcterms.hasPart, expression } = {}
) {
  return ({ html, subject }, { title, level }) => {
    const { faIcon, levelColor, levelShort } = getParts({ html }, { level })

    return html`
      <zack-filter operator="${operator}"
                   title="Filter ${levelShort}: ${title}"
                   .predicate="${predicate}"
                   property-path-prefix="${prefix}"
                   property-path-postfix="${postfix}"
                   .expression="${expression}"
                   .label="${levelShort}: ${title}"
                   .value="${subject}">
        <div data-toggle="tooltip" data-placement="right" class="vertical-text"
             style="height: 100%; background-color: ${levelColor}">${faIcon}
        </div>
      </zack-filter>
    `
  }
}

export default renderFilter()
