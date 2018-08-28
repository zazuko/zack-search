/* global app */
const colorHash = new (require('color-hash'))()
const rdf = require('@rdfjs/data-model')

const terms = {
  conceptTag: rdf.namedNode('http://data.alod.ch/alod/conceptTag'),
  description: rdf.namedNode('http://purl.org/dc/terms/description'),
  intervalEnds: rdf.namedNode('http://www.w3.org/2006/time#intervalEnds'),
  intervalStarts: rdf.namedNode('http://www.w3.org/2006/time#intervalStarts'),
  isRepresentedBy: rdf.namedNode('http://data.archiveshub.ac.uk/def/isRepresentedBy'),
  level: rdf.namedNode('http://data.archiveshub.ac.uk/def/level'),
  note: rdf.namedNode('http://data.archiveshub.ac.uk/def/note'),
  physicalForm: rdf.namedNode('http://data.alod.ch/alod/physicalForm'),
  recordID: rdf.namedNode('http://data.alod.ch/alod/recordID'),
  referenceCode: rdf.namedNode('http://data.alod.ch/alod/referenceCode'),
  relation: rdf.namedNode('http://purl.org/dc/terms/relation'),
  title: rdf.namedNode('http://purl.org/dc/terms/title')
}

function getHierarchy (graph, subject) {
  const title = graph.match(subject, terms.title).toArray().shift()
  const level = graph.match(subject, terms.level).toArray().shift()
  let titleString

  if (!level) {
    return []
  }

  if (title) {
    titleString = title.object.value
  } else {
    titleString = subject.value
    console.warn('Missing title on ', subject.value)
  }

  let hierarchy = [{
    subject: subject,
    title: titleString,
    level: level.object.value
  }]

  const relation = graph.match(subject, terms.relation).toArray().shift()

  if (relation) {
    hierarchy = getHierarchy(graph, relation.object).concat(hierarchy)
  }

  return hierarchy
}

const renderer = {}

renderer.init = function (metadata, options) {
  renderer.start = metadata.start
  renderer.end = metadata.end
  renderer.options = options
}

renderer.renderResult = function (page, subject) {
  let rendering = ''
  const hierarchy = getHierarchy(page, subject)
  let hierarchyString = ''
  let lvl
  for (lvl in hierarchy.slice(0, -1)) {
    const lvlString = hierarchy[lvl].level
    const lvlShort = lvlString.substring(lvlString.lastIndexOf('/') + 1, lvlString.length)
    const lvlColor = colorHash.hex(lvlShort)

    hierarchyString = hierarchyString +
        '<li>' +
          '<a data-filterable="="' +
            ' data-toggle="tooltip" data-placement="bottom" title="Filter ' + lvlShort + ': ' + hierarchy[lvl].title + '"' +
            ' data-predicate="http://purl.org/dc/terms/hasPart"' +
            ' data-property-path-prefix="^"' +
            ' data-property-path-postfix="+"' +
            ' data-label="' + lvlShort + ': ' + hierarchy[lvl].title + '"' +
            ' data-value="' + hierarchy[lvl].subject.value + '" ' +
            ' data-named-node' +
            ' onclick="app.search.addFilter(this)"style="background-color: ' + lvlColor + '">' + hierarchy[lvl].title +
          '<span class="result-hierarchy-after" style="border-left-color: ' + lvlColor + '"> </span></a>' +
        '</li>'
  }

  const title = page.match(subject, terms.title).toArray().shift()
  let titleString = ''
  if (title) {
    titleString = title.object.value
  } else {
    titleString = subject.value
    console.log('Not good: Missing title on ', subject.value)
  }

  const titleLink = '<a target="_blank" href="' + subject.value + '">' + titleString + '</a>'

  let level = ''
  const tf = app.findPlugin('TypeFilter')
  if (tf) {
    const faLevel = tf.options.values

    const levelString = page.match(subject, terms.level).toArray().shift().object.value
    const levelShort = levelString.substring(levelString.lastIndexOf('/') + 1, levelString.length)
    const levelColor = colorHash.hex(levelShort)

    let faIcon = 'question'
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
        ' onclick="app.search.addFilter(this)" style="background-color: ' + levelColor + '"><i class="fa ' + faIcon + '"></i></div></div>'
  }

  let referenceString = ''
  const referenceCode = page.match(subject, terms.referenceCode).toArray().shift()
  if (referenceCode) {
    referenceString = referenceCode.object.value
  } else {
    const recordId = page.match(subject, terms.recordID).toArray().shift()
    if (recordId) {
      referenceString = recordId.object.value
    }
  }

  const reference = '<span><i>' + referenceString + '</i></span>'

  //  var maintenanceAgencyCode = page.match(subject, 'http://data.archiveshub.ac.uk/def/maintenanceAgencyCode').toArray().shift()
  //  var maintenanceAgency = ''
  //  if (maintenanceAgencyCode) {
  //    maintenanceAgency = '<div data-filterable="="' +
  //      ' data-predicate="' + maintenanceAgencyCode.predicate.toString() + '" ' +
  //      ' data-value="' + maintenanceAgencyCode.object.toString() + '" ' +
  //      ' class="filterable" onclick="app.search.addFilter(this)">' + maintenanceAgencyCode.object.toString() + '</div>'
  //  }

  const conceptTags = page.match(subject, terms.conceptTag).toArray()
  let conceptTagDivs = '<div class="result-tags">'
  if (conceptTags) {
    conceptTags.forEach(function (tag) {
      conceptTagDivs = conceptTagDivs + '<div data-filterable="="' +
        ' data-predicate="' + tag.predicate.value + '" ' +
        ' data-value="' + tag.object.value + '" ' +
        ' class="filterable" onclick="app.search.addFilter(this)">' + tag.object.value + '</div>'
    })
  }

  const createTagButton = '<div class="actionable" data-title="' + titleString + '" data-iri="' + subject.value + '" onclick="app.tag.create(this)">add tag</div>'

  conceptTagDivs += createTagButton

  conceptTagDivs = conceptTagDivs + '</div>'

  const url = page.match(subject, terms.isRepresentedBy).toArray().shift()
  let urlLink = ''
  if (url) {
    urlLink = '<span><a target="_blank" href="' + url.object.value + '"><i class="fa fa-external-link" title="Link to Archive"></i> </a></span>'
  }

  const description = page.match(subject, terms.description).toArray().shift()
  let descSpan = ''
  if (description) {
    descSpan = '<span>Description: ' + description.object.value + '</span>'
  } else {
    const note = page.match(subject, terms.note).toArray().shift()
    if (note) {
      descSpan = '<span>Note: ' + note.object.value + '</span>'
    }
  }

  const physicalForm = page.match(subject, terms.physicalForm).toArray().shift()
  let physical = ''
  if (physicalForm) {
    physical = '<span>' + physicalForm.object.value + '</span>'
  }

  const intervalStarts = page.match(subject, terms.intervalStarts).toArray().shift()
  const intervalEnds = page.match(subject, terms.intervalEnds).toArray().shift()

  let timeTick = ''
  let timeRange = ''
  if (intervalStarts) {
    const timelineMargin = 40
    const date = new Date(intervalStarts.object.value)
    const range = renderer.end - renderer.start
    const width = document.getElementById('zack-timeline').offsetWidth - timelineMargin
    if (date instanceof Date && !isNaN(date.valueOf())) {
      const offset = ((width / range) * (date - renderer.start)) + (timelineMargin / 2)
      timeTick = '<div style="left: ' + offset + 'px;" class="result-time-tick"></div>' +
        '<div style="left: ' + offset + 'px;" class="result-time-tick-hover"></div>'
    }
    let timeR
    if (intervalEnds) {
      timeR = new Date(intervalStarts.object.value).getFullYear() + '-' + new Date(intervalEnds.object.value).getFullYear()
    } else {
      timeR = new Date(intervalStarts.object.value).getFullYear()
    }
    timeRange = '<span> (' + timeR + ')</span>'
  }

  rendering = '<div class="zack-result row">' +
      '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">' + timeTick + '<div class="result-hierarchy-clip"><ul class="result-hierarchy">' + hierarchyString + '</ul></div></div>' +
      '<div class="col-lg-4 col-md-6 col-sm-6 col-xs-12">' + level + '<div class="result-main">' + titleLink + '</div></div>' +
      '<div class="col-lg-4 col-md-6 col-sm-6 col-xs-12">' + reference + timeRange + '</div>' +
      '<div class="col-lg-4 col-md-6 hidden-sm hidden-xs">' + conceptTagDivs + '</div>' +
      '<div class="col-lg-8 hidden-md hidden-sm hidden-xs">' + urlLink + descSpan + physical + '</div>' +
      '</div>'

  return rendering
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

module.exports = renderer
