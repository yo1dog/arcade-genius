const makeConfig = require('./webpack.common.js');

module.exports = {
  ...makeConfig('production'),
};