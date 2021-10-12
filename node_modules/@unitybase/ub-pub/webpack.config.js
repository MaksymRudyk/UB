// Created by pavel.mash on 04.09.2016.

const path = require('path')

module.exports = {
  entry: './ub-pub.js',
  output: {
    filename: 'ub-pub.min.js',
    library: 'UB',
    libraryTarget: 'umd'
  },
  externals: {
    'lodash': {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_'
    }
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/
    }]
  },

  plugins: [  ]
}
