import rdf from 'rdf-ext'
import SparqlClient from 'sparql-http-client'

const terms = {
  numberOfResults: rdf.namedNode('http://voc.zazuko.com/zack#numberOfResults'),
  queryStart: rdf.namedNode('http://voc.zazuko.com/zack#queryStart'),
  queryEnd: rdf.namedNode('http://voc.zazuko.com/zack#queryEnd'),
  type: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  score: rdf.namedNode('http://voc.zazuko.com/zack#score')
}

export function SparqlSearchResultList (options) {
  this.options = options || {}

  this.client = new SparqlClient({
    endpointUrl: options.endpointUrl
  })

  this.resultTypes = options.resultTypes.map(function (resultType) {
    if (typeof resultType === 'string') {
      return rdf.namedNode(resultType)
    } else {
      return resultType
    }
  })

  this.rows = []

  this.start = ''
  this.end = ''
}

SparqlSearchResultList.prototype.search = function (query) {
  const self = this

  this.query = query

  if (this.options.onFetching) {
    this.options.onFetching()
  }

  return this.fetchResultLength().then(function (length) {
    const metadata = {
      length: length,
      start: self.start,
      end: self.end
    }

    if (self.options.onResultMetadata) {
      self.options.onResultMetadata(metadata)
    }

    if (self.options.onFetched) {
      self.options.onFetched()
    }
  })
}

SparqlSearchResultList.prototype.buildMetadataQuery = function () {
  return this.buildMetadataFilterQuery().replace(/\${searchString}/g, this.query)
}

SparqlSearchResultList.prototype.fetchResultLength = function () {
  const self = this
  const query = this.buildMetadataQuery()

  return this.client.query.construct(query, { operation: 'postUrlencoded' }).then(function (stream) {
    return rdf.dataset().import(stream)
  }).then(function (graph) {
    const count = graph.match(null, terms.numberOfResults).toArray().shift()

    const querystart = graph.match(null, terms.queryStart).toArray().shift()
    const queryend = graph.match(null, terms.queryEnd).toArray().shift()

    if (!querystart && !queryend) {
      self.start = ''
      self.end = ''
    } else {
      self.start = new Date(querystart.object.value)
      self.end = new Date(queryend.object.value)
    }

    if (!count) {
      return 0
    }

    return parseInt(count.object.value)
  })
}

SparqlSearchResultList.prototype.buildResultQuery = function (offset) {
  return this.buildResultFilterQuery()
    .replace('${searchString}', this.query) // eslint-disable-line no-template-curly-in-string
    .replace('${offset}', offset) // eslint-disable-line no-template-curly-in-string
    .replace('${limit}', this.options.pageSize) // eslint-disable-line no-template-curly-in-string
}

SparqlSearchResultList.prototype.fetchPage = function (offset) {
  const query = this.buildResultQuery(offset)

  return this.client.query.construct(query, { operation: 'postUrlencoded' }).then(function (stream) {
    return rdf.dataset().import(stream)
  })
}

SparqlSearchResultList.prototype.resultSubjects = function (page) {
  let subjects = this.resultTypes.map(function (resultType) {
    return page.match(null, terms.type, resultType).toArray().map(function (triple) {
      return triple.subject
    })
  }).reduce(function (pre, cur) {
    return pre.concat(cur)
  })

  // sort subjects if they have a score property
  if (page.match(null, terms.score).length > 0) {
    subjects = subjects.sort(function (a, b) {
      const scoreA = parseFloat(page.match(a, terms.score).toArray().shift().object.value)
      const scoreB = parseFloat(page.match(b, terms.score).toArray().shift().object.value)

      return scoreB - scoreA
    })
  }

  return subjects
}
