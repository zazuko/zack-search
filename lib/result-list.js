import { Event } from 'crab-event'
import './components/zack-results'
import './components/zack-result'

export function ResultList (options) {
  this.options = options
  this.isFetching = 0
}

ResultList.prototype.name = 'ResultList'

ResultList.prototype.init = function (app) {
  const self = this

  this.app = app

  this.app.events.resultMetadata = new Event()

  document.querySelector('#compactToggle')
    ?.addEventListener('change', (e) => {
      document.querySelector('zack-results').compact = e.target.checked
    })

  // connect events
  this.app.events.fetched.on(function () {
    self.isFetching--
    if (!self.isFetching) {
      if (document.getElementById('zack-spinner')) {
        document.getElementById('zack-spinner').classList.add('paused')
      }
    }
  })

  this.app.events.fetching.on(function () {
    self.isFetching++
    if (document.getElementById('zack-spinner')) {
      document.getElementById('zack-spinner').classList.remove('paused')
    }
  })

  this.app.events.resultMetadata.on(function (metadata) {
    document.getElementById('count').innerHTML = metadata.length
    document.getElementById('scrollArea').scrollTop = 0
  })
}
