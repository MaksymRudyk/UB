/**
 * Created by pavel.mash on 14.02.2017
 */
const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    main: path.join(__dirname, 'index.js')
  },
  output: {
    filename: 'ubs.[name].min.js',
    publicPath: '/clientRequire/@unitybase/ubs/public/dist/',
    library: 'unitybase_ubs',
    libraryTarget: 'var'
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
        { loader: 'style-loader' },
        { loader: 'css-loader' }
      ]
    }, {
      // jsPDF use a zlib.js which does not export. Let's fix it
      test: /zlib/,
      use: 'exports-loader?DecodeStream,FlateStream'
    }]
  },
  // devtool: 'source-map',

  plugins: [
    new webpack.DefinePlugin({
      BOUNDLED_BY_WEBPACK: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
}
