import { Event } from 'crab-event'

export function ResultList (options) {
  this.options = options
}

ResultList.prototype.name = 'ResultList'

ResultList.prototype.init = function (app) {
  this.app = app

  this.app.events.resultMetadata = new Event()

  document.querySelector('#compactToggle')
    ?.addEventListener('change', (e) => {
      document.querySelector('zack-results').compact = e.target.checked
    })

  // connect events
  this.app.events.resultMetadata.on(function (metadata) {
    document.getElementById('count').innerHTML = metadata.length
  })
}
