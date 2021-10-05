export function download (type, contents, filename) {
  const element = document.createElement('a')
  element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(contents)}`)
  element.setAttribute('download', filename)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}
