'use strict';

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var ignore = require('gulp-ignore');
var exists = require('101/exists');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var packageJSON = require('./package.json');

/**
 * Common Directories.
 * @type {Object}
 */
var dir = {
  lib: "./lib/",
  js: './dist/js/'
};

/**
 * Browserfies a file stream.
 */
var browserified = transform(function(filename) {
  var b = browserify(filename);
  return b.bundle();
});

/**
 * Runs jshint on project source.
 */
gulp.task('lint', function() {
  return gulp.src([dir.lib + '*.js', './index.js'])
    .pipe(jshint(packageJSON.jshintConfig))
    .pipe(jshint.reporter(stylish));
});

/**
 * Compiles and packages the project source into the
 * `dist/js/` directory.
 */
gulp.task('js', ['lint'], function() {
  return gulp.src('./index.js')
    .pipe(browserified)
    .pipe(rename({ basename: 'notex' }))
    .pipe(gulp.dest(dir.js))
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(dir.js));
});
