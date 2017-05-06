var colorHash = new (require('color-hash'))

function getHierarchy (graph, subject) {
  var title = graph.match(subject, 'http://purl.org/dc/terms/title').toArray().shift()
  var level = graph.match(subject, 'http://data.archiveshub.ac.uk/def/level').toArray().shift()

  if (!level) {
    return []
  }

  if(title) {
    var titleString = title.object.toString()
  } else {
    var titleString = subject.toString()
    console.log('Not good: Missing title on ', subject.toString())
  }

  var hierarchy = [{
    subject: subject,
    title: titleString,
    level: level.object.toString()
  }]

  var relation = graph.match(subject, 'http://purl.org/dc/terms/relation').toArray().shift()

  if (relation) {
    hierarchy = getHierarchy(graph, relation.object).concat(hierarchy)
  }

  return hierarchy
}

var renderer = {}

renderer.init = function (metadata, options) {
  renderer.start = metadata.start
  renderer.end = metadata.end
  renderer.options = options
}

renderer.renderResult = function (page, subject) {
  var rendering = ''
  var hierarchy = getHierarchy(page, subject)
  var hierarchyString = ''
  for (niv in hierarchy.slice(0,-1)) {
    var nivString = hierarchy[niv].level
    var nivShort = nivString.substring(nivString.lastIndexOf('/') + 1, nivString.length)
    var nivColor = colorHash.hex(nivShort)

    hierarchyString = hierarchyString + 
        '<li>' +
          '<a data-filterable="="' +
            ' data-toggle="tooltip" data-placement="bottom" title="Filter ' + nivShort + ': ' + hierarchy[niv].title + '"' +
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

  var title = page.match(subject, 'http://purl.org/dc/terms/title').toArray().shift()
  var titleString = ''
  if (title) {
    titleString = title.object.toString()
  } else {
    titleString =  subject.toString()
    console.log('Not good: Missing title on ', subject.toString())
  }

  var titleLink = '<a target="_blank" href="' + subject.toString() + '">' + titleString + '</a>'

  var level = ''
  var tf = app.options.plugins.find(function(x) {return x.name == "TypeFilter"})
  if(tf) {
    var faLevel = tf.options.values

    var levelString = page.match(subject, 'http://data.archiveshub.ac.uk/def/level').toArray().shift().object.toString()
    var levelShort = levelString.substring(levelString.lastIndexOf('/') + 1, levelString.length)
    var levelColor = colorHash.hex(levelShort)

    var faIcon = 'question'
    if (levelString in faLevel) {
      faIcon = faLevel[levelString].icon
    }

    level = '<div class="result-level-wrap"><div class="vertical-text result-level" data-filterable="="' +
        ' data-toggle="tooltip" data-placement="right" title="Filter ' + levelShort + ': ' + titleString + '"' +
        ' data-predicate="http://purl.org/dc/terms/hasPart"' +
        ' data-property-path-prefix="^"' +
        ' data-property-path-postfix="+"' +
        ' data-label="' + levelShort + ': ' + titleString + '"' +
        ' data-value="' + subject + '" ' +
        ' data-named-node' +
        ' onclick="app.search.addFilter(this)" style="background-color: ' + levelColor + '"><i class="fa '+ faIcon + '"></i></div></div>'
  }


  var referenceString = ''
  var referenceCode = page.match(subject, 'http://data.alod.ch/alod/referenceCode').toArray().shift()
  if (referenceCode) {
    referenceString = referenceCode.object.toString()
  } else {
    var recordId = page.match(subject, 'http://data.alod.ch/alod/recordID').toArray().shift()
    if (recordId) {
      referenceString = recordId.object.toString()
    }
  }


  var reference = '<span><i>' + referenceString + '</i></span>'


//  var maintenanceAgencyCode = page.match(subject, 'http://data.archiveshub.ac.uk/def/maintenanceAgencyCode').toArray().shift()
//  var maintenanceAgency = ''
//  if (maintenanceAgencyCode) {
//    maintenanceAgency = '<div data-filterable="="' +
//      ' data-predicate="' + maintenanceAgencyCode.predicate.toString() + '" ' +
//      ' data-value="' + maintenanceAgencyCode.object.toString() + '" ' +
//      ' class="filterable" onclick="app.search.addFilter(this)">' + maintenanceAgencyCode.object.toString() + '</div>'
//  }

  var conceptTags = page.match(subject, 'http://data.alod.ch/alod/conceptTag').toArray()
  var conceptTagDivs = '<div class="result-tags">'
  if (conceptTags) {
      conceptTags.forEach(function(tag) {
          conceptTagDivs = conceptTagDivs + '<div data-filterable="="' +
        ' data-predicate="' + tag.predicate.toString() + '" ' +
        ' data-value="' + tag.object.toString() + '" ' +
        ' class="filterable" onclick="app.search.addFilter(this)">' + tag.object.toString() + '</div>'
      })
  }
  conceptTagDivs = conceptTagDivs + '</div>'

  var url = page.match(subject, 'http://data.archiveshub.ac.uk/def/isRepresentedBy').toArray().shift()
  var urlLink = ''
  if (url) {
    urlLink = '<span><a href="' + url.object.toString() + '">Direct Link to Archive</a></span>'
  }

  var description = page.match(subject, 'http://purl.org/dc/terms/description').toArray().shift()
  var descSpan = ''
  if (description) {
    descSpan = '<span>Description: '  + description.object.toString() + '</span>'
  } else {
    var note = page.match(subject, 'http://data.archiveshub.ac.uk/def/note').toArray().shift()
    if (note) {
      descSpan = '<span>Note: '  + note.object.toString() + '</span>'
    }
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
      '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">' + timeTick + '<div class="result-hierarchy-clip"><ul class="result-hierarchy">' + hierarchyString + '</ul></div></div>' +
      '<div class="col-lg-4 col-md-6 col-sm-6 col-xs-12">' + level + '<div class="result-main">' + titleLink + '</div></div>' +
      '<div class="col-lg-4 col-md-6 col-sm-6 col-xs-12">'+ reference + timeRange + '</div>' +
      '<div class="col-lg-4 col-md-6 hidden-sm hidden-xs">' + conceptTagDivs + '</div>' +
      '<div class="col-lg-8 hidden-md hidden-sm hidden-xs">' + descSpan + physical + urlLink + '</div>' +
      '</div>'

  return rendering
}

renderer.postRender = function () {
  //tooltips
  /*
  var elementsTooltip = document.querySelectorAll('[data-toggle=tooltip]');
  for (var i = 0; i < elementsTooltip.length; i++){
    new Tooltip(elementsTooltip[i])
  }
  */

  //timetick cursor
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
