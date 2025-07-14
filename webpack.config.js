const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const dir_js = path.resolve(__dirname, 'app');
const dir_build = path.resolve(__dirname, 'dist');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'index.js'),
  },
  output: {
    path: dir_build,
    filename: 'bundle.js',
  },
  resolve: {
    modules: ['node_modules', dir_js],
  },
  devServer: {
    static: dir_build,
  },
  devtool: 'source-map',
  stats: {
    colors: true,
    chunkModules: false,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './app/assets',
          to: 'assets',
        },
        {
          from: './node_modules/font-awesome/fonts',
          to: 'fonts',
        },
      ],
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /index\.html$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      },
      {
        test: /\.html$/,
        exclude: /index\.html$/,
        loader: 'raw-loader',
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'less-loader',
        ],
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
};