import { Directive, directive, PartType } from 'lit/directive.js'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import Clownface from 'clownface/lib/Clownface'
import { schema } from '@tpluscode/rdf-ns-builders/strict'

const translationDatasets = new Map()
let combinedTranslations = clownface({ dataset: $rdf.dataset() })

function getTranslation (key) {
  return combinedTranslations
    .has(schema.name, key)
    .out(schema.value, { language: [...TranslationDirective.languages, '*'] })
    .value
}

class TranslationDirective extends Directive {
  constructor (partInfo) {
    super(partInfo)
    if (
      partInfo.type !== PartType.CHILD && partInfo.type !== PartType.ATTRIBUTE
    ) {
      throw new Error('The `translate` directive must be used in the child or attribute contexts')
    }

    this.parent = partInfo.parentNode
  }

  render (key) {
    const translation = getTranslation(key)

    if (translation) {
      this.value = translation
    } else {
      this.value = `Missing translation for '${key}'`
    }

    return this.value
  }
}

TranslationDirective.languages = navigator.languages

export const translate = directive(TranslationDirective)
translate.languages = function (languages) {
  TranslationDirective.languages = languages
}

translate.set = function (language, dataset) {
  translationDatasets.set(language, dataset)

  const datasets = [...translationDatasets.values()]
  combinedTranslations = Clownface.fromContext(datasets.flatMap(dataset => clownface({ dataset })._context))
}

translate.get = getTranslation
