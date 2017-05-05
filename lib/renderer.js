var colorHash = new (require('color-hash'))
var _ = new (require('lodash'))

function getHierarchy (graph, subject) {
  var title = graph.match(subject, 'http://purl.org/dc/elements/1.1/title').toArray().shift()
  var level = graph.match(subject, 'http://data.archiveshub.ac.uk/def/level').toArray().shift()

  if (!title || !level) {
    return []
  }

  var hierarchy = [{
    subject: subject,
    title: title.object.toString(),
    level: level.object.toString()
  }]

  var relation = graph.match(subject, 'http://purl.org/dc/elements/1.1/relation').toArray().shift()

  if (relation) {
    hierarchy = getHierarchy(graph, relation.object).concat(hierarchy)
  }

  return hierarchy
}

var renderer = {}

renderer.init = function (metadata) {
  renderer.start = metadata.start
  renderer.end = metadata.end
}

renderer.renderResult = function (page, subject) {
  var rendering = ''
  var hierarchy = getHierarchy(page, subject)
  var hierarchyString = ''
  for (niv in hierarchy.slice(0,-1)) {
    var id = _.uniqueId()
    var nivString = hierarchy[niv].level
    var nivShort = nivString.substring(nivString.lastIndexOf('/') + 1, nivString.length)
    var nivColor = colorHash.hex(nivShort)

    hierarchyString = hierarchyString + 
        '<li>' +
          '<a id="' + id  + '" data-filterable="="' +
            ' data-predicate="http://purl.org/dc/terms/hasPart"' +
            ' data-property-path-prefix="^"' +
            ' data-property-path-postfix="+"' +
            ' data-label="' + nivShort + ': ' + hierarchy[niv].title + '"' +
            ' data-value="' + hierarchy[niv].subject.nominalValue + '" ' +
            ' data-named-node' +
            ' onclick="app.search.addFilter(this)"style="background-color: ' + nivColor + '">' + hierarchy[niv].title +
          '<span class="result-hierarchy-after" style="border-left-color: ' + nivColor + '"> </span></a>' +
        '</li>'
  }

  var title = page.match(subject, 'http://purl.org/dc/elements/1.1/title').toArray().shift()
  var titleString = '<span><a href="' + subject.toString() + '">' + title.object.toString() + '</a></span>'

  var archive = page.match(subject, 'http://data.archiveshub.ac.uk/def/maintenanceAgencyCode').toArray().shift()
  var archiveColor = colorHash.hex(archive.object.toString()+archive.object.toString()+archive.object.toString())

  var archive = '<div class="result-level-wrap"><div class="vertical-text result-level" style="background-color: ' + archiveColor + '"></div></div>'

  var referenceCode = page.match(subject, 'http://data.alod.ch/alod/referenceCode').toArray().shift()
  var recordId = page.match(subject, 'http://data.alod.ch/alod/recordID').toArray().shift()

  var referenceString = recordId.object.toString()
  if (referenceCode) {
    referenceString = referenceCode.object.toString()
  }
  var reference = '<span><i>' + referenceString + '</i></span>'


  var maintenanceAgencyCode = page.match(subject, 'http://data.archiveshub.ac.uk/def/maintenanceAgencyCode').toArray().shift()
  var maintenanceAgency = ''
  if (maintenanceAgencyCode) {
    maintenanceAgency = '<div data-filterable="="' +
      ' data-predicate="' + maintenanceAgencyCode.predicate.toString() + '" ' +
      ' data-value="' + maintenanceAgencyCode.object.toString() + '" ' +
      ' class="filterable" onclick="app.search.addFilter(this)">' + maintenanceAgencyCode.object.toString() + '</div>'
  }

  var conceptTags = page.match(subject, 'http://data.alod.ch/alod/conceptTag').toArray()
  var conceptTagDivs = ''
  if (conceptTags) {
      conceptTags.forEach(function(tag) {
          conceptTagDivs = conceptTagDivs + '<div data-filterable="="' +
        ' data-predicate="' + tag.predicate.toString() + '" ' +
        ' data-value="' + tag.object.toString() + '" ' +
        ' class="filterable" onclick="app.search.addFilter(this)">' + tag.object.toString() + '</div>'
      })
  }

  var url = page.match(subject, 'http://data.archiveshub.ac.uk/def/isRepresentedBy').toArray().shift()
  var urlLink = ''
  if (url) {
    urlLink = '<span><a href="' + url.object.toString() + '">Direct Link to Archive</a></span>'
  }

  var note = page.match(subject, 'http://data.archiveshub.ac.uk/def/note').toArray().shift()
  var noteSpan = ''
  if (note) {
    noteSpan = '<span>Note: '  + note.object.toString() + '</span>'
  }

  var physicalForm = page.match(subject, 'http://data.alod.ch/alod/physicalForm').toArray().shift()
  var physical = ''
  if (physicalForm) {
    physical = '<span>'  + physicalForm.object.toString() + '</span>'
  }



  var intervalStarts = page.match(subject, 'http://www.w3.org/2006/time#intervalStarts').toArray().shift()
  var intervalEnds = page.match(subject, 'http://www.w3.org/2006/time#intervalEnds').toArray().shift()

  var timeTick = ''
  var timeRange = ''
  if (intervalStarts) {
    var timelineMargin = 40;
    var date = new Date(intervalStarts.object.toString())
    var range = renderer.end - renderer.start
    var width = document.getElementById('zack-timeline').offsetWidth - timelineMargin
    if (date instanceof Date && !isNaN(date.valueOf())) {
      var offset = ((width / range) * (date - renderer.start)) + (timelineMargin / 2)
      timeTick = '<div style="left: ' + offset + 'px;" class="result-time-tick"></div>' +
        '<div style="left: ' + offset + 'px;" class="result-time-tick-hover"></div>'
    }
    var timeR
    if (intervalEnds) {
        timeR = new Date(intervalStarts.object.toString()).getFullYear() + '-' + new Date(intervalEnds.object.toString()).getFullYear()
    } else {
        timeR = new Date(intervalStarts.object.toString()).getFullYear()
    }
    timeRange = '<span> ('+timeR+')</span>'
  }

  rendering = '<div class="zack-result row">' +
      '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">' + archive + timeTick + '<ul class="result-hierarchy">' + hierarchyString + '</ul></div>' +
      '<div class="col-lg-4 col-md-6 col-sm-12 col-xs-12"><div class="result-main">'+ titleString + reference + timeRange + '</div></div>' +
      '<div class="col-lg-4 col-md-6 hidden-sm hidden-xs">' + maintenanceAgency + '</br>' + conceptTagDivs + '</div>' +
      '<div class="col-lg-4 hidden-md hidden-sm hidden-xs">' + noteSpan + '</br>' + physical + urlLink + '</div>' +
      '</div>'

  return rendering
}

renderer.postRender = function () {
  var cursorVisibility = function (val) {
    document.getElementById('timeCursor').style.visibility = val
  }

  var cursorPosition = function (e) {
    var timelineMargin = 40;
    document.getElementById('timeCursor').style.left = (e.clientX - document.getElementById('zack-timeline').offsetLeft) - (timelineMargin / 2) +  'px'
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
