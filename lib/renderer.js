var colorHash = new (require('color-hash'))

var renderer = {}

renderer.init = function (metadata) {
  renderer.start = metadata.start
  renderer.end = metadata.end
}

renderer.renderResult = function (page, subject) {
  var rendering = ''

  var level = page.match(subject, 'http://data.archiveshub.ac.uk/def/level').toArray().shift()

  var levelString = level.toString()
  var levelShort = levelString.substring(levelString.lastIndexOf('/') + 1, levelString.length - 3)
  var levelColor = colorHash.hex(levelShort)

  var title = page.match(subject, 'http://purl.org/dc/elements/1.1/title').toArray().shift()

  var level = '<div class="result-level-wrap"><div class="vertical-text result-level" data-filterable="="' +
      ' data-predicate="http://purl.org/dc/terms/hasPart"' +
      ' data-property-path-prefix="^"' +
      ' data-property-path-postfix="+"' +
      ' data-label="' + levelShort + ': ' + title.object.toString() + '"' +
      ' data-value="' + subject + '" ' +
      ' data-named-node' +
      ' onclick="app.addFilter(this)" style="background-color: ' + levelColor + '">' + levelShort + '</div></div>'

  var titleString = '<a href="' + subject.toString() + '">' + title.object.toString() + '</a>'

  var referenceCode = page.match(subject, 'http://data.alod.ch/alod/referenceCode').toArray().shift()
  var recordId = page.match(subject, 'http://data.alod.ch/alod/recordID').toArray().shift()

  var referenceString = recordId.object.toString()
  if (referenceCode) {
    referenceString = referenceCode.object.toString()
  }
  var reference = '<i>' + referenceString + '</i>'


  var maintenanceAgencyCode = page.match(subject, 'http://data.archiveshub.ac.uk/def/maintenanceAgencyCode').toArray().shift()
  var maintenanceAgency = ''
  if (maintenanceAgencyCode) {
    maintenanceAgency = '<div data-filterable="="' +
      ' data-predicate="' + maintenanceAgencyCode.predicate.toString() + '" ' +
      ' data-value="' + maintenanceAgencyCode.object.toString() + '" ' +
      ' class="filterable" onclick="app.addFilter(this)">' + maintenanceAgencyCode.object.toString() + '</div>'
  }

  var conceptTags = page.match(subject, 'http://data.alod.ch/alod/conceptTag').toArray()
  var conceptTagDivs = ''
  if (conceptTags) {
      conceptTags.forEach(function(tag) {
          conceptTagDivs = conceptTagDivs + '<div data-filterable="="' +
        ' data-predicate="' + tag.predicate.toString() + '" ' +
        ' data-value="' + tag.object.toString() + '" ' +
        ' class="filterable" onclick="app.addFilter(this)">' + tag.object.toString() + '</div>'
      })
  }


  var intervalStarts = page.match(subject, 'http://www.w3.org/2006/time#intervalStarts').toArray().shift()
  var intervalEnds = page.match(subject, 'http://www.w3.org/2006/time#intervalEnds').toArray().shift()

  var timeTick = ''
  var timeRange = ''
  if (intervalStarts) {
    var date = new Date(intervalStarts.object.toString())
    var range = renderer.end - renderer.start
    var width = document.getElementById('zack-timeline').offsetWidth - 40
    if (date instanceof Date && !isNaN(date.valueOf())) {
      var offset = ((width / range) * (date - renderer.start)) + 20
      timeTick = '<div style="left: ' + offset + 'px;" class="result-time-tick"></div>' +
        '<div style="left: ' + offset + 'px;" class="result-time-tick-hover"></div>'
    }
    var timeR
    if (intervalEnds) {
        timeR = new Date(intervalStarts.object.toString()).getFullYear() + '-' + new Date(intervalEnds.object.toString()).getFullYear()
    } else {
        timeR = new Date(intervalStarts.object.toString()).getFullYear()
    }
    timeRange = '<div>'+timeR+'</div>'
  }

  rendering = '<div class="zack-result row">' +
      '<div class="one-third column">' + level + '' + '<div class="result-main">' + timeTick + titleString + timeRange + '</br>' + reference + '</div></div>' +
      '<div class="two-thirds column">' + maintenanceAgency + conceptTagDivs + '</div>' + 
      '</div>'

  return rendering
}

renderer.postRender = function () {
  var cursorVisibility = function (val) {
    document.getElementById('timeCursor').style.visibility = val
  }

  var cursorPosition = function (e) {
    document.getElementById('timeCursor').style.left = e.clientX + 'px'
  }

  Array.prototype.forEach.call(document.getElementsByClassName('result-time-tick-hover'), function (el) {
    el.addEventListener('mouseover', function () { cursorVisibility('visible') })
    el.addEventListener('touchenter', function () { cursorVisibility('visible') })
    el.addEventListener('mouseout', function () { cursorVisibility('hidden') })
    el.addEventListener('touchleave', function () { cursorVisibility('hidden') })
    el.addEventListener('mousemove', cursorPosition)
  })
}

module.exports = renderer
