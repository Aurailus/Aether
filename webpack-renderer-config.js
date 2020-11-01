//
// The config file for the electron render thread,
// Sets up typescript & scss compilation, static asset inclusion, and sets the target to electron-renderer.
// Also sets up the `app``entry point.
//

const webpack = require('webpack');
const merge   = require('webpack-merge');

const HtmlWebpackPlugin          = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = merge.smart(require('./webpack-base-config'), {

    // Set the target so that webpack and plugins compile code compatible with electron.
    target: 'electron-renderer',
    
    // Set the entry point that the dependency graph will be built from.
    entry: {
        // Create the entry point `app` for the electron renderer, include @babel/polyfill lib in dependency graph.
        app: ['@babel/polyfill','./src/renderer/app.tsx']
    },
    
    module: {
        rules: [

            // Typescript and React combilation using Babel.
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

                        // Polyfills to make sure that the last 2 chromium versions can run the code.
                        [ '@babel/preset-env', { targets: { browsers: 'last 2 versions ' } } ],
                        // Specifies to compile typescript source into Javascript.
                        '@babel/preset-typescript',
                        // Specifies to compile react source (.tsx) as well.
                        '@babel/preset-react'
                    ],
                    plugins: [

                        // Allow class properties (properties defined outside of functions)
                        ['@babel/plugin-proposal-class-properties', { loose: true }]
                    ]
                }
            },

            // SCSS compilation using sass-loader.
            {
                test: /\.scss$/,
                // Run scss files through sass-loader, css-loader, and finally style-loader (in that order).
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            },

            // CSS inclusion using css-loader.
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            },

            // Static image asset inclusion using image-webpack-loader
            {
                // Run on gif, png, jpeg, jpg, and svg files.
                test: /\.(gif|png|jpe?g|svg)$/,
                use: [
                    'file-loader', {
                        loader: 'image-webpack-loader',
                        // Does something that is required in webpack 2.x+ (which we are on)
                        options: { disable: true }
                    }
                ]
            },

            // All outputted '.js' files will have their sourcemaps reprocessed by 'source-map-loader'.
            {
                // Preloader, occurs before the other loaders.
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            }
        ]
    },

    // Define the plugins that will be used for this module.
    plugins: [

        // Run the typescript checker on a seperate process to improve build times.
        new ForkTsCheckerWebpackPlugin({
            reportFiles: ['src/renderer/**/*']
        }),

        // Displays module path when using HMR, only for development.
        new webpack.NamedModulesPlugin(),

        // Does something to make HTML files work better.
        new HtmlWebpackPlugin(),
    
        // Manipulates process.env.NODE_ENV, setting it to 'development' if it is not already specified.
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ],
});
