import Zack from '../lib/zack'
import { TypeFilter } from '../lib/type-filter'
import { Intro } from '../lib/intro'
import '../lib/components/zack-timeline'

const options = {
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
        search: 'stardogResultset',
        count: 'stardogMeta',
        histogram: 'stardogHistogram',
        textmatch: 'stardogFulltextPart'

      }
    },
    'https://query.wikidata.org/sparql': {
      queries: {
        tagSearch: 'wikidataHlsTagSearch'
      }
    }
  },
  plugins: [
    new TypeFilter({
      predicate: 'http://data.archiveshub.ac.uk/def/level',
      values: {
        'http://data.alod.ch/alod/level/archive': { icon: 'fa-university', title: 'Archives' },
        'http://data.alod.ch/alod/level/fond': { icon: 'fa-archive', title: 'Fonds' },
        'http://data.alod.ch/alod/level/subfond': { icon: 'fa-archive', title: 'Sub-Fonds' },
        'http://data.alod.ch/alod/level/series': { icon: 'fa-sitemap', title: 'Series' },
        'http://data.alod.ch/alod/level/file': { icon: 'fa-folder-open', title: 'Files' },
        'http://data.alod.ch/alod/level/item': { icon: 'fa-file', title: 'Items' }
      }
    }),
    new Intro({
      backdrop: true,
      orphan: true,
      steps: [
        { element: '#query', title: 'Filter by Query', content: 'Enter keywords to filter the results by.' },
        {
          element: '#type-filters',
          placement: 'bottom',
          title: 'Filter by Hierarchy Level',
          content: 'Filter the results to a specific hierarchy level.<dl>' +
                        '<dt>Archives</dt><dd>an independent institution</dd>' +
                        '<dt>Fonds</dt><dd>...</dd>' +
                        '<dt>Sub-Fonds</dt><dd>...</dd>' +
                        '<dt>Series</dt><dd>a series of related collections or documents</dd>' +
                        '<dt>Files</dt><dd>a collection of documents</dd>' +
                        '<dt>Items</dt><dd>an individual documents</dd></dl>'
        },
        { element: '.result-tags .actionable:first', title: 'Contribute Tags', content: 'You can contribute to the project by adding your own tags.' }
      ]
    })
  ]
}

window.app = new Zack(options)

document.querySelector('zack-search').app = window.app

window.app.init().catch(function (err) {
  console.error(err)
})
