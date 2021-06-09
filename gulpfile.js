const { dest, parallel, src, watch } = require('gulp');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const loadFiles = require('./utils/config').loadFiles;

const fs = require('fs');
const through2 = require('through2');
const HTMLParser = require('node-html-parser');
const mjml = require('gulp-mjml');
const mustache = require('gulp-mustache');
const mjmlEngine = require('mjml');
const prettier = require('gulp-prettier');
const htmlmin = require('gulp-htmlmin');

const browserSync = require('browser-sync').create();

function build() {
  return new Promise((resolve, reject) => {
    fs.readdir('./src/users', (err, users) => {
      if (err) return reject(err);
      users.forEach(user => {
        argv.user = user;
        processAssets();
        return processHtml();
      });
      return resolve(users);
    })
  })
}

function processHtml () {
  var user = argv.user || argv.u || 'default';
  var data = loadFiles(['./src/default/data.yml', './src/users/' + user + '/data.yml']);
  data.user = user;
  if (argv.env !== 'production') {
    data.assetUrl = '.';
  }

  return src('./src/default/signature.mjml')
    .pipe(mustache(data))
    // .pipe(through2.obj(file => console.log(file.contents.toString())))
    .pipe(mjml(mjmlEngine, {validationLevel: 'soft'}))
    .pipe(through2.obj(extractRequiredHtml))
    .pipe(htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      removeOptionalTags: true
    }))
    .pipe(argv.env !== 'production' ? prettier() : through2.obj())
    .pipe(dest('./dist/' + user));
}

function processAssets () {
  var user = argv.user || argv.u || 'default';
  return src('./src/default/assets/**/*')
    .pipe(dest('./dist/' + user + '/assets'));
}

function extractRequiredHtml (file, _, cb) {
  if (file.isBuffer()) {
    const code = HTMLParser.parse(file.contents.toString());
    const styles = code.querySelectorAll('head style');
    const body = code.querySelector('body');
    styles.forEach(style => body.appendChild(style));
    file.contents = Buffer.from(body.removeWhitespace().innerHTML);
  }
  cb(null, file);
}

function serve() {
  var user = argv.user || argv.u || 'default';
  browserSync.init({
      server: {
         baseDir: "./dist",
         index: "/" + user + "/signature.html"
      }
  });
  watch('./src/**/*.{mjml,mustache,yml}', processHtml);
  watch('./src/**/*.{png}', processAssets);
  watch('./dist/**/*').on('change',browserSync.reload);
}

exports.build = build;
exports.compile = parallel(processHtml, processAssets);
exports.watch = serve;
