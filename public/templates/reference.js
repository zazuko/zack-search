export default function ({ html, subject }, { referenceCode, intervalStarts, intervalEnds }) {
  const reference = html`<span><i>${referenceCode?.value}</i></span>`

  let timeRange = ''
  if (intervalStarts?.value) {
    let timeR
    const date = new Date(intervalStarts.value)
    let intervalEndDate
    if (intervalEnds?.value && date.getFullYear() !== (intervalEndDate = new Date(intervalEnds.value)).getFullYear()) {
      timeR = html`${date.getFullYear()}-${intervalEndDate.getFullYear()}`
    } else {
      timeR = date.getFullYear()
    }
    timeRange = html`<span> (${timeR})</span>`
  }

  return html`${reference} ${timeRange}`
}
