require('shelljs/global')

mkdir('-p', '.build')

exec('node_modules/js-string-escape-cli/cli.js --commonjs queries/zack.count.sparql .build/zack-count-sparql.js')
exec('node_modules/js-string-escape-cli/cli.js --commonjs queries/zack.sparql .build/zack-sparql.js')
exec('node_modules/js-string-escape-cli/cli.js --commonjs queries/zack.histogram.sparql .build/zack-histogram-sparql.js')

mkdir('-p','dist')

exec('node_modules/browserify/bin/cmd.js lib/app.js --debug | node_modules/exorcist/bin/exorcist.js dist/zack.js.map > dist/zack.js')
exec('node_modules/uglify-js/bin/uglifyjs dist/zack.js --in-source-map dist/zack.js.map --source-map dist/zack.min.js.map --source-map-url zack.min.js.map --output dist/zack.min.js')

cp('-r', 'public/*', 'dist/')
