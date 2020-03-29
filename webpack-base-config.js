//
// Set basic information, allow resolution of .tsx, .ts, .js, and .json files,
// set mode to development and enable source-mapping.
//

'use strict';
const path = require('path');

module.exports = {

    // Default mode, will be overrided in other config files.
    mode: 'development',
    
    // Output as dist/[name of the source file].js
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },

    // Don't allow webpack to polyfill __dirname & __filename constants.
    node: {
        __dirname: false,
        __filename: false
    },

    // Allow us to not include the file extension for .tsx, .ts, .js, and .json files.
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json']
    },

    // Provides a source map to the original code (not sure if this works..)
    devtool: 'source-map'
    
};
