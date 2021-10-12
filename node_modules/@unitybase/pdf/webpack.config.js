/**
 * Created by pavel.mash on 10.02.2017
 */
const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    app: './index.js'
  },
  output: {
    filename: 'pdf.min.js',
    publicPath: '/clientRequire/@unitybase/pdf/dist/',
    library: '@unitybase/pdf',
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
      exclude: /node_modules/,
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }]
  },

  plugins: [
    new webpack.DefinePlugin({
      BOUNDLED_BY_WEBPACK: true
    })
  ],
  resolve: {
    fallback: {
      buffer: false
    }
  }
}
