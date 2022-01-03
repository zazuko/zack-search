import { rdf, sh } from '@tpluscode/rdf-ns-builders/strict'
import clownface from 'clownface'
import $rdf from 'rdf-ext'

/**
 * Find nodes by following a path equivalent to SPARQL
 *
 * sh:and*&#8205;/rdf:rest*&#8205;/rdf:first?/?path
 */
export const getFromShapeHierarchy = prop => {
  const shapeHierarchy = clownface({ dataset: $rdf.dataset() }).blankNode()

  shapeHierarchy.addList(sh.path, [
    shapeHierarchy.blankNode().addOut(sh.zeroOrMorePath, sh.and),
    shapeHierarchy.blankNode().addOut(sh.zeroOrMorePath, rdf.rest),
    shapeHierarchy.blankNode().addOut(sh.zeroOrOnePath, rdf.first),
    prop
  ])

  return shapeHierarchy.out(sh.path)
}

export function getProperties (shape) {
  return shape?.out(sh.property)
    .toArray()
    .sort((left, right) => {
      const leftOrder = left.out(sh.order).value ? Number.parseInt(left.out(sh.order).value) : 100
      const rightOrder = right.out(sh.order).value ? Number.parseInt(right.out(sh.order).value) : 100
      return leftOrder - rightOrder
    })
    .map(property => ({
      name: property.out(sh.name).value,
      path: property.out(sh.path)
    })) || []
}
