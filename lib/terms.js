import rdf from '@rdfjs/data-model'

export const terms = {
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
