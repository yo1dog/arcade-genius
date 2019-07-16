/* eslint-env node */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'index.js'),
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([{from: 'static'}])
  ],
  module: {
    rules: [
      {test: /\.(html|svg)?$/, use: ['html-loader']},
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
      }
    ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '..', 'dist')
  },
  performance: {
    hints: false
  },
  node: {
    fs: 'empty'
  }
};