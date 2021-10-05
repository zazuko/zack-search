export default function ({ html }, { thumbnail, title }) {
  return thumbnail?.value ? html`<img part="thumbnail-img" src="${thumbnail.value}" alt="${title}">` : ''
}
