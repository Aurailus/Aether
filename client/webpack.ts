import { resolve } from 'path';
import * as Webpack from 'webpack';
import { merge } from 'webpack-merge';

const LiveReloadPlugin     = require('webpack-livereload-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const CSSMinimizerPlugin   = require('css-minimizer-webpack-plugin');
const ForkTsCheckerPlugin  = require('fork-ts-checker-webpack-plugin');

export default function(_: {}, argv: { mode: string; analyze: boolean }) {
	const mode: 'production' | 'development' = argv.mode as any ?? 'development';
	process.env.NODE_ENV = mode;

	let config: Webpack.Configuration = {
		mode: mode,
		name: 'aether',
		stats: 'errors-warnings',
		devtool: mode === 'production' ? undefined : 'nosources-source-map',

		context: resolve(__dirname),
		entry: { main: './src/Main.ts' },

		resolve: {
			extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			alias: {
				'react': 'preact/compat',
				'react-dom': 'preact/compat'
			}
		},

		output: {
			path: resolve(__dirname, './build')
		},

		plugins: [
			new ForkTsCheckerPlugin({
				typescript: {
					configFile: resolve(__dirname, 'tsconfig.json')
				},
				eslint: {
					files: './src/**/*.{ts,tsx}',
					options: {
						configFile: resolve(__dirname, '.eslintrc.js'),
						emitErrors: true,
						failOnHint: true,
						typeCheck: true
					}
				}
			}),
			new MiniCSSExtractPlugin()
		],

		module: {
			rules: [{
				test: /\.[t|j]sx?$/,
				loader: 'babel-loader',
				options: {
					babelrc: false,
					cacheDirectory: true,
					presets: [
						['@babel/preset-typescript', {
							isTSX: true,
							allExtensions: true,
							jsxPragma: 'h'
						}],
						[ '@babel/preset-env', {
							targets: { browsers: [ 'Chrome 78' ] }
						}]
					],
					plugins: [
						[ '@babel/transform-react-jsx', { pragma: 'h' } ],
						[ '@babel/plugin-proposal-class-properties' ],
						[ '@babel/plugin-proposal-private-methods' ]
					]
				}
			}, {
				test: /\.tw$/,
				use: [
					MiniCSSExtractPlugin.loader,
					{ loader: 'css-loader', options: { url: false, importLoaders: 1 } },
					'postcss-loader'
				]
			}, {
				test: /\.sss$/,
				use: [
					MiniCSSExtractPlugin.loader,
					{ loader: 'css-loader', options: { url: false, importLoaders: 1, modules: {
						localIdentName: mode === 'development' ? '[local]_[hash:base64:4]' : '[hash:base64:8]'
					} } },
					'postcss-loader'
				]
			}]
		},
		optimization: {
			minimizer: [
				'...',
				new CSSMinimizerPlugin()
			]
		}
	};

	if (mode === 'development') config = merge(config, { plugins: [ new LiveReloadPlugin({ delay: 500 }) ] });

	return config;
}
