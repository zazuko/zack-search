const renderer = {}

renderer.init = function (metadata, options) {
  renderer.start = metadata.start
  renderer.end = metadata.end
  renderer.options = options
}

renderer.renderResult = function (page, subject) {
  document.querySelector('zack-results').addPage(subject, page)

  return `<zack-result class="row" subject="${subject.value}"></zack-result>`
}

renderer.postRender = function () {
  // tooltips
  /*
  var elementsTooltip = document.querySelectorAll('[data-toggle=tooltip]');
  for (var i = 0; i < elementsTooltip.length; i++){
    new Tooltip(elementsTooltip[i])
  }
  */

  // timetick cursor
  const cursorVisibility = function (val) {
    document.getElementById('timeCursor').style.visibility = val
  }

  const cursorPosition = function (e) {
    const timelineMargin = 40
    document.getElementById('timeCursor').style.left = (e.clientX - document.getElementById('zack-timeline').offsetLeft) - (timelineMargin / 2) + 'px'
  }

  Array.prototype.forEach.call(document.getElementsByClassName('result-time-tick-hover'), function (el) {
    el.addEventListener('mouseover', function () { cursorVisibility('visible') })
    el.addEventListener('touchenter', function () { cursorVisibility('visible') })
    el.addEventListener('mouseout', function () { cursorVisibility('hidden') })
    el.addEventListener('touchleave', function () { cursorVisibility('hidden') })
    el.addEventListener('mousemove', cursorPosition)
  })
}

export default renderer
