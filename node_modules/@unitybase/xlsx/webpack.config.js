/**
 * Created by pavel.mash on 04.09.2016.
 */
const path = require('path')

module.exports = {
  entry: {
    app: './index.js'
  },
  output: {
    filename: 'xlsx-all.min.js',
    library: 'XLSX',
    libraryTarget: 'umd'
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: [/node_modules/]
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }]
  },
  externals: {
    lodash: {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_'
    }
  }
}
