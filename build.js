require('shelljs/global')

mkdir('-p', '.build')

exec('js-string-escape --commonjs queries/zack.count.sparql .build/zack-count-sparql.js')
exec('js-string-escape --commonjs queries/zack.sparql .build/zack-sparql.js')
exec('js-string-escape --commonjs queries/zack.histogram.sparql .build/zack-histogram-sparql.js')

mkdir('-p','dist')

exec('browserify lib/app.js --debug | exorcist dist/zack.js.map > dist/zack.js')
exec('uglifyjs dist/zack.js --in-source-map dist/zack.js.map --source-map dist/zack.min.js.map --source-map-url zack.min.js.map --output dist/zack.min.js')

cp('-r', 'public/*', 'dist/')