import { dcterms } from 'https://jspm.dev/@tpluscode/rdf-ns-builders'

export function renderFilter (
  { operator = '=', prefix = '^', postfix = '+', predicate = dcterms.hasPart, expression } = {}
) {
  return ({ html, subject }, { intervalStarts }) => {
    let timeTick = ''
    if (intervalStarts?.value) {
      const timelineMargin = 40
      const date = new Date(intervalStarts.value)
      const range = this.range.end - this.range.start
      const width = document.querySelector('zack-timeline').offsetWidth - timelineMargin
      if (!isNaN(date.valueOf())) {
        const offset = ((width / range) * (date - this.range.start)) + (timelineMargin / 2)
        timeTick = html`
          <zack-result-time-tick .offset="${offset}"></zack-result-time-tick>`
      }
    }

    return html`
      ${timeTick}
      <zack-result-hierarchy .subject="${subject}"
                             .filterPrefix="${prefix}"
                             .filterPostfix="${postfix}"
                             .filterOperator="${operator}"
                             .filterExpression="${expression}"
      ></zack-result-hierarchy>
    `
  }
}

export default renderFilter()
