export default function ({ html, subject }, { title }) {
  return html`
    <zack-result-level .title="${title?.value}" .subject="${subject}"></zack-result-level>
  `
}
