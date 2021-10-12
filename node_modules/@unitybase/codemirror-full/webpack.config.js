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
    filename: 'codemirror-all.min.js',
    publicPath: '/clientRequire/@unitybase/codemirror-all',
    library: '@unitybase/codemirror-all',
    libraryTarget: 'umd'
  },
  externals: {
    lodash: {
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
      exclude: [/node_modules/]
    }, {
      test: /\.css$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' },
      ],
    }, {
      // jsPDF use a zlib.js which does not export. Let's fix it
      test: /zlib/,
      use: 'exports-loader?DecodeStream,FlateStream'
      // adds below code the file's source:
      //  exports["DecodeStream"] = DecodeStream;
      //  exports["FlateStream"] = FlateStream;
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      BOUNDLED_BY_WEBPACK: true
    })
  ],
  resolve: {
    fallback: {
      util: false,
      assert: false
    }
  }

}
