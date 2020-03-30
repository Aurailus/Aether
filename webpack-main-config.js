//
// The config file for the electron main thread,
// Sets up typescript compilation, typescript resolution, and sets the target to electron-main.
// Also sets up the `main` entry point.
//

const fs 			= require('fs');
const path    = require('path');
const webpack = require('webpack');
const merge   = require('webpack-merge');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

// Find node modules with binaries and ignore them
const externals = {}
fs.readdirSync('node_modules').filter(x => {
  return ['.bin'].indexOf(x) === -1
}).forEach(mod => {
  externals[mod] = `commonjs ${mod}`
});

externals['sqlite3'] = 'sqlite3'

module.exports = merge.smart(require('./webpack-base-config'), {

	// Set the target so that webpack and plugins compile code compatible with electron.
	target: 'electron-main',

	// Set the entry point that the dependency graph will be built from.
	entry: {
		// Create the entry point `main` for electron.
		main: './src/main/main.ts'
	},

	// Ignore modules with binaries.
	externals: externals,

	module: {
		rules: [
			{
				// Apply rule to typescript and TSX files.
				test: /\.tsx?$/,
				// Don't compile anything in node_modules.
				exclude: /node_modules/,
				// Use babel-loader for compilation.
				loader: 'babel-loader',
				// Babel-loader options.
				options: {

					// Cache the compiled files to speed up recompilation.
					cacheDirectory: true,
					// Don't search for a separate babel config file.
					babelrc: false,
					
					presets: [

						// Polyfills to make sure all maintained node environments can run the compiled source.
						[ '@babel/preset-env', { targets: 'maintained node versions' } ],
						// Specifies to compile typescript source into Javascript.
						'@babel/preset-typescript'
					],
					plugins: [

						// Allow class properties (properties defined outside of functions)
						['@babel/plugin-proposal-class-properties', { loose: true }]
					]
				}
			}
		]
	},

	// Define the plugins that will be used for this module.
	plugins: [

		// Run the typescript checker on a seperate process to improve build times.
		new ForkTsCheckerWebpackPlugin({
			reportFiles: ['src/main/**/*']
		}),
	
		// Manipulates process.env.NODE_ENV, setting it to 'development' if it is not already specified.
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
		}),
	],
});
