const makeConfig = require('./webpack.common.js');

module.exports = {
  ...makeConfig('development'),
  devServer: {
    contentBase: './dist',
    port: 8080
  }
};