/* eslint-env node */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
//const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      //{test: /\.less$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']}
      {test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader']}
    ]
  }
});