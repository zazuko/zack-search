/* global mkdir, exec, cp */
require('shelljs/global')

const spawn = require('child_process').spawn
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

const child = spawn('./node_modules/.bin/webpack', [
  '--mode',
  'production',
  '--config',
  'default.webpack.config.js'
])

child.stdout.on('data', function (data) {
  process.stdout.write(data)
})

child.stderr.on('data', function (data) {
  process.stdout.write(data)
})

child.on('exit', function (data) {
  process.stdout.write('Webpack build done.')

  cp('-r', 'public/*', 'dist/')
})
