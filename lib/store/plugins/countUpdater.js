export default {
  model: {
    effects () {
      return {
        'results/setResultMetadata' ({ length }) {
          const countEl = document.getElementById('count')
          countEl.innerHTML = length
        }
      }
    }
  }
}
