/**
 * Created by pavel.mash on 2018-07-15
 */
const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    app: './index.js'
  },
  output: {
    library: 'unitybase_system_plugin_vue_ub',
    libraryTarget: 'umd',
    filename: 'system_plugin_vue_ub.min.js',
    publicPath: '/clientRequire/@unitybase/systemjs-plugin-vue-ub/dist/'
  },
  externals: {
    lodash: '_',
    '@unitybase/ub-pub': 'UB',
    '@unitybase/adminui-pub': '$App'
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: [/node_modules/]
    }, {
      test: /\.css$/,
      use: [
        {
          loader: 'style-loader/url',
          options: {
            hmr: false
          }
        },
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          }
        }
      ]
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      BOUNDLED_BY_WEBPACK: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
}
