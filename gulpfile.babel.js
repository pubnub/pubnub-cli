/* eslint arrow-body-style: 0 */
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean');
const babel = require('gulp-babel');
const watch = require('gulp-watch');
const batch = require('gulp-batch');

gulp.task('lint_src', () => {
  return gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('lint_test', () => {
  return gulp.src(['test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('clean', () => {
  return gulp.src(['lib', 'coverage'], { read: false })
    .pipe(clean());
});

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'));
});

gulp.task('run_tests', () => {
  return gulp
    .src('test/**/*.test.js', { read: false })
    .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('watch', () => {
  // Endless stream mode
  return watch('src/**/*.js', batch((events, done) => {
    gulp.start('compile', done);
  }));
});

gulp.task('lint', (done) => {
  runSequence('lint_src', 'lint_test', done);
});

gulp.task('test', (done) => {
  runSequence('run_tests', 'lint', done);
});

gulp.task('compile', (done) => {
  runSequence('clean', 'babel', done);
});
