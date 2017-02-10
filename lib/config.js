module.exports = {
  endpointUrl: '/query',
  filterContainer: 'filter-container',
  resultTypes: ['http://data.archiveshub.ac.uk/def/ArchivalResource'],
  resultList: {
    pageSize: 20,
    preload: 80
  },
  endpoints: {
    '/query': {
      queries: {
        search: 'fusekiSearch',
        count: 'fusekiCount',
        histogram: 'fusekiHistogram',
        textmatch: 'fusekiTextmatch'
      }
    }
  }
}
