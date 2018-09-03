const path = require('path')

module.exports = {
  entry: ['@babel/polyfill', './lib/dist'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zack.js',
    library: 'Zack'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: /(node_modules\/.*)/,
        loader: 'babel-loader',
        options: {
          presets: [['@babel/env', { 'targets': 'ie 11' }]],
          plugins: [
            ['transform-object-rest-spread', { useBuiltIns: true }]
          ]
        }
      }
    ]
  }
}
