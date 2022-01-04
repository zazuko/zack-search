export default {
  onStore (store) {
    document.querySelector('#compactToggle')
      ?.addEventListener('change', (e) => {
        store.dispatch.results.setCompactView(e.target.checked)
      })
  }
}
