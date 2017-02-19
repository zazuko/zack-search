require('shelljs/global')

var camelCase = require('lodash/camelCase')
var fs = require('fs')
var glob = require('glob').sync
var path = require('path')

mkdir('-p', '.build')

// build queries index module
var queries = 'module.exports = {\n' + glob('queries/*.sparql').map(function (sparqlFile) {
  var basename = path.basename(sparqlFile, '.sparql')

  // convert sparql queries to CommonJS modules
  exec('js-string-escape --commonjs ' + sparqlFile + ' ' + path.join('.build', basename) + '.js')

  // convert module names to module index
  return '  ' + camelCase(basename) + ': require(\'' + path.join('../.build', basename) + '\')'
}).join(',\n') + '\n}\n'

fs.writeFileSync('.build/queries.js', queries)

mkdir('-p','dist')

exec('browserify lib/dist.js --standalone Zack --debug | exorcist dist/zack.js.map > dist/zack.js')
exec('uglifyjs dist/zack.js --in-source-map dist/zack.js.map --source-map dist/zack.min.js.map --source-map-url zack.min.js.map --output dist/zack.min.js')

cp('-r', 'public/*', 'dist/')
