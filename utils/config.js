const _ = require('lodash');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Merge in config file if it exists
 *
 * @since 3.0.0
 * @alias lando.utils.config.loadFiles
 * @param {Array} files - An array of files to try loading
 * @return {Object} An object of config merged from file sources
 */
 exports.loadFiles = files => _(files)
 // Filter if file exists
 .filter(fs.existsSync)
 // Start collecting
 .reduce((a, file) => _.merge(a, yaml.load(fs.readFileSync(file))), {});
