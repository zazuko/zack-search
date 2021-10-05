import { sh } from '@tpluscode/rdf-ns-builders/strict'

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
