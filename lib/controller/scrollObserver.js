import { Directive, directive } from 'lit/directive.js'
import { noChange } from 'lit'

class IntersectionDirective extends Directive {
  constructor (partInfo) {
    super()
    this.element = partInfo.element
  }

  render (controller) {
    controller.observer.observe(this.element)

    return noChange
  }
}

const intersectionDirective = directive(IntersectionDirective)

export class ScrollObserverController {
  constructor (host) {
    this.host = host
    this.observer = new IntersectionObserver(this.__callback.bind(this))
    this.inView = new Set()
  }

  observe () {
    return intersectionDirective(this)
  }

  __callback (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.inView.add(entry.target)
      } else {
        this.inView.delete(entry.target)
      }
    }

    this.host.load([...this.inView])
  }
}
