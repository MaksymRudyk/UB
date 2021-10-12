/**
 * Created by pavel.mash on 04.09.2016.
 */
const webpack = require('webpack')

module.exports = {
  entry: {
    app: './adminui.js'
  },
  output: {
    library: 'adminUI',
    libraryTarget: 'umd',
    filename: 'adminui.[name].min.js',
    publicPath: '/clientRequire/@unitybase/adminui-pub/dist/'
  },
  resolve: {
    alias: {
      lodash: require.resolve('lodash')
    }
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: [/node_modules/]
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: require.resolve('tinymce/tinymce'),
      use: [{
        loader: 'imports-loader',
        options: {
          imports: {
            moduleName: 'tinymce',
            name: 'tinymce'
          },
          wrapper: 'window'
        }
      }]
    }, {
      // this option is required for tinyMCE, see https://github.com/tinymce/tinymce/issues/2836
      test: /tinymce[\\/](themes|plugins)[\\/]/,
      use: [{
        loader: 'imports-loader',
        options: {
          wrapper: 'window'
        }
      }]
    }]
  },

  plugins: [
    new webpack.DefinePlugin({
      BOUNDLED_BY_WEBPACK: true
    })
  ]
}
