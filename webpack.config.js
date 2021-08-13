const { merge } = require('webpack-merge')
const { createDefaultConfig } = require('@open-wc/building-webpack')
const path = require('path')

module.exports = (env, argv) => {
  let output, webpackIndexHTMLPlugin
  let input = path.resolve(__dirname, './public/index.html')

  /*
      For production build, we disable the HTML plugin and create a single js output
     */
  output = {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zack.js',
    library: 'Zack'
  }
  input = path.resolve(__dirname, 'index.js')
  webpackIndexHTMLPlugin = {
    template: () => '<html><head></head><body></body></html>'
  }

  return merge(
    createDefaultConfig({
      input,
      webpackIndexHTMLPlugin,
      plugins: {
        workbox: false
      }
    }),
    {
      output,
      resolve: {
        extensions: ['.mjs', '.js', '.json'],
        alias: {
          stream: 'readable-stream'
        }
      },
      module: {
        rules: [
          {
            test: /\.sparql$/,
            use: ['raw-loader']
          },
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          }
        ]
      },
      node: {
        crypto: true
      },
      devServer: {
        proxy: {
          '/query': {
            target: 'http://data.alod.ch',
            secure: false,
            changeOrigin: true
          }
        }
      }
    }
  )
}
