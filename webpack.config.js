var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var dir_js = path.resolve(__dirname, 'app');
var dir_assets = path.resolve(__dirname, 'app', 'assets');
var dir_build = path.resolve(__dirname, 'dist');

module.exports = {
		entry: {
			app : path.resolve(__dirname, 'index.js')
		},
		output: {
				path: dir_build,
				filename: 'bundle.js'
		},
		resolve: {
			 modulesDirectories: ['node_modules', dir_js],
		},
		devServer: {
				contentBase: dir_build,
		},
		postcss: function () {
				return [require('autoprefixer')];
		},
		devtool: 'source-map',
		stats: {
				colors: true,
				chunkModules: false
		},
		plugins: [
				new ExtractTextPlugin('[name].css', {	allChunks: true }),
				new webpack.optimize.CommonsChunkPlugin('vendor', '[name].js'),
				new webpack.NoErrorsPlugin(),
				new CopyWebpackPlugin([
					{
						from: './app/assets',
						to: 'assets'
					}
				]),
				new CopyWebpackPlugin([
					{
						from: './node_modules/font-awesome/fonts',
						to: 'fonts'
					}
				]),
				new webpack.ProvidePlugin({
				    $: "jquery",
				    jQuery: "jquery",
				    "window.jQuery": "jquery"
				})
		],
		module: {
				loaders: [
						{
								loader: 'file?name=assets[name].[ext]',
								test: /\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/
						},
						{
								loader: 'babel-loader',
								test: /\.js$/,
								exclude: /node_modules/,
								presets : ['es2015']
						},
						{
								loader: 'file?name=/[name].html',
								test: /index.html$/
						},
						{
								loader: 'raw',
								test: /\.html$/,
								exclude: /index.html$/
						},
						{
								// loader: ExtractTextPlugin.extract('style-loader', 'css-loader?sourceMap!postcss-loader!less-loader?sourceMap'),
								loader: ExtractTextPlugin.extract('style-loader', 'raw-loader?sourceMap!postcss-loader!less-loader?sourceMap'),
								test: /\.less$/
						}
				]
		}
}
