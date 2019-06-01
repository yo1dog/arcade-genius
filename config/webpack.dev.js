/* eslint-env node */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    port: 8080
  },
  module: {
    rules: [
      {test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader']}
    ]
  }
});