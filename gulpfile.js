/* eslint "max-len": ["error", 120] */
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var runSequence = require('run-sequence');

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('run_tests', function () {
  return gulp
    .src('test/**/*.test.js', { read: false })
    .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('test', function (done) {
  runSequence('run_tests', 'lint', done);
});
