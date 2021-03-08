const webpack = require('webpack');
const path = require('path');

const config = {
  name: "index",
  entry: './web/src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'web/public')
  }
};

module.exports = config;