import rdf from 'rdf-ext'
import SparqlClient from 'sparql-http-client'
import { vcard } from '@tpluscode/rdf-ns-builders'
import { store } from './store'
import clownface from 'clownface'

const terms = {
  numberOfResults: rdf.namedNode('http://voc.zazuko.com/zack#numberOfResults'),
  queryStart: rdf.namedNode('http://voc.zazuko.com/zack#queryStart'),
  queryEnd: rdf.namedNode('http://voc.zazuko.com/zack#queryEnd'),
  type: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  score: rdf.namedNode('http://voc.zazuko.com/zack#score')
}

const MAX_LIMIT = 9999

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
  return this.buildMetadataFilterQuery({
    searchString: store.state.search.textQuery
  })
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

SparqlSearchResultList.prototype.buildResultQuery = function (offset, noLimit = false) {
  return this.buildResultFilterQuery({
    searchString: store.state.search.textQuery,
    offset,
    limit: noLimit ? MAX_LIMIT : this.options.pageSize
  })
}

SparqlSearchResultList.prototype.fetchResults = function (offset, noLimit) {
  const query = this.buildResultQuery(offset, noLimit)

  return this.client.query.construct(query, { operation: 'postUrlencoded' }).then(function (stream) {
    return rdf.dataset().import(stream)
  })
}

SparqlSearchResultList.prototype.resultSubjects = function (dataset, descending) {
  const page = clownface({ dataset })

  return this.resultTypes.map(function (resultType) {
    return dataset.match(null, terms.type, resultType).toArray().map(function (triple) {
      return triple.subject
    })
  }).reduce(function (pre, cur) {
    return pre.concat(cur)
  }).sort((a, b) => {
    const left = page.node(a).out(vcard['sort-string']).value || ''
    const right = page.node(b).out(vcard['sort-string']).value || ''

    if (descending) {
      return right.localeCompare(left)
    }
    return left.localeCompare(right)
  })
}
