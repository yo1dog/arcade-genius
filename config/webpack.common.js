/* eslint-env node */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const fontRegExp = /\.(woff2?|eot|ttf|otf)$/;


module.exports = {
  // the entry point JS files (included in index.html)
  entry: {
    bundle : path.resolve(__dirname, '..', 'src', 'index', 'index.js'),
    preload: path.resolve(__dirname, '..', 'src', 'index', 'preload.js'),
  },
  plugins: [
    // clean the dist folder before each build
    new CleanWebpackPlugin(),
    
    // extract all CSS into it's own file so it can be loaded independent
    // of the JS
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      chunkFilename: 'styles.[hash].css'
    }),
    
    // create index.html using the template and put JS/CSS tags
    // into the header
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '..', 'src', 'index', 'index.ejs'),
      inject: 'head',
      templateParameters: {
        appVersion: require('../package.json').version
      }
    }),
    
    // add link tags to preload fonts
    new PreloadWebpackPlugin({
      rel: 'preload',
      include: 'allAssets',
      as: entry => fontRegExp.test(entry)? 'font' : 'style',
      fileWhitelist: [
        fontRegExp,
        /\.css$/
      ]
    }),
    
    // add the "async" attribute to the bundle.js file's script tag in index.html
    // so it will load async and not block
    new ScriptExtHtmlWebpackPlugin({
      async: /^bundle\./
    })
  ],
  module: {
    rules: [
      // html files are loaded as strings
      {test: /\.html?$/, use: 'html-loader'},
      
      // LESS files are compiled into CSS
      // CSS is then combined into a single file
      {test: /\.less$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']},
      
      // fonts and image files are copied to dist folder and referenced by URL
      {
        test: [
          fontRegExp,
          /\.ico|\.png$/
        ],
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]'
          }
        }
      },
      
      // WebAssembly files are copied to dist folder and referenced by URL
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]'
          }
        }
      }
    ]
  },
  output: {
    // output the entry point JS files into the dist folder and use a
    // hash of their content as part of their filename to bust caches
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '..', 'dist')
  },
  performance: {
    // don't warn us about performance issues
    //hints: false
  },
  optimization: {
    // move the runtime information into it's own chunk so it does not
    // interfere with content hashes
    runtimeChunk: 'single'
  },
  node: {
    // don't include the Node.js filesystem libraries in the bundle
    // because we don't use them
    fs: 'empty'
  }
};