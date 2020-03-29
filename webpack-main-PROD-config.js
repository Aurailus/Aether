//
// Webpack main config, set to production mode.
//

const merge = require('webpack-merge');
module.exports = merge.smart(require('./webpack-main-config'), { mode: 'production' });
