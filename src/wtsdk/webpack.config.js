const path = require('path');
const webpack = require('webpack');
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally');

const plugins = [
  new MergeIntoSingleFilePlugin({
    files: {
      'wtsdk.js': ['./.tmp/**/*.js']
    }
  })
];

module.exports = {
  entry: './.tmp/index.js',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    MSFS: 'MSFS'
  },
  externalsType: 'global',
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  optimization: {
    minimize: false
  },
  output: {
    filename: 'wtsdk.js',
    path: path.resolve(__dirname, '.tmp'),
  },
  plugins: plugins,
  stats: 'verbose'
};