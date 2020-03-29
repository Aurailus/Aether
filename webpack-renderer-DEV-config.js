//
// Set up the hot loader for the electron renderer thread.
// This will also start the main process as a precursor to the devServer initialization.
//

const merge = require('webpack-merge');
const spawn = require('child_process').spawn;

module.exports = merge.smart(require('./webpack-renderer-config'), {
    resolve: {
        alias: {
            'react-dom': '@hot-loader/react-dom'
        }
    },

    devServer: {
        port: 2003,
        compress: true,
        noInfo: true,
        stats: 'errors-only',
        inline: true,
        hot: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        historyApiFallback: {
            verbose: true,
            disableDotRule: false
        },

        before() {
            if (process.env.START_HOT) {
                console.log('Starting main process');
                spawn('npm', ['run', 'start-main-dev'], {
                    shell: true,
                    env: process.env,
                    stdio: 'inherit'
                })
                .on('close', code => process.exit(code))
                .on('error', spawnError => console.error(spawnError));
            }
        }
    }
});
