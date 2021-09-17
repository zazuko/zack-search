import { namedNode } from '@rdf-esm/data-model'
import { dcterms, time } from '@tpluscode/rdf-ns-builders'

export const terms = {
  conceptTag: namedNode('http://data.alod.ch/alod/conceptTag'),
  description: dcterms.description,
  intervalEnds: time.intervalEnds,
  intervalStarts: time.intervalStarts,
  isRepresentedBy: namedNode('http://data.archiveshub.ac.uk/def/isRepresentedBy'),
  level: namedNode('http://data.archiveshub.ac.uk/def/level'),
  note: namedNode('http://data.archiveshub.ac.uk/def/note'),
  physicalForm: namedNode('http://data.alod.ch/alod/physicalForm'),
  recordID: namedNode('http://data.alod.ch/alod/recordID'),
  referenceCode: namedNode('http://data.alod.ch/alod/referenceCode'),
  relation: dcterms.relation,
  title: dcterms.title,
  hasPart: dcterms.hasPart
}
