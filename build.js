/* global mkdir, exec, cp */
require('shelljs/global')

const camelCase = require('lodash/camelCase')
const fs = require('fs')
const glob = require('glob').sync
const path = require('path')

mkdir('-p', '.build')

// build queries index module
const queries = 'module.exports = {\n' + glob('queries/*.sparql').map(function (sparqlFile) {
  const basename = path.basename(sparqlFile, '.sparql')

  // convert sparql queries to CommonJS modules
  exec('js-string-escape --commonjs ' + sparqlFile + ' ' + path.join('.build', basename) + '.js')

  // convert module names to module index
  return '  ' + camelCase(basename) + ': require(\'' + path.join('../.build', basename) + '\')'
}).join(',\n') + '\n}\n'

fs.writeFileSync('.build/queries.js', queries)

mkdir('-p', 'dist')

exec('browserify lib/dist.js --standalone Zack --debug | exorcist dist/zack.js.map > dist/zack.js')
exec('uglifyjs dist/zack.js --source-map="content=\'dist/zack.js.map\'" --output dist/zack.min.js')

cp('-r', 'public/*', 'dist/')
