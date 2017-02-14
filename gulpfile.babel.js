/* eslint arrow-body-style: 0 */
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const runSequence = require('run-sequence');
const clean = require('gulp-clean');
const watch = require('gulp-watch');
const batch = require('gulp-batch');

const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');

let tsProject = ts.createProject('tsconfig.json', { noImplicitAny: true });

gulp.task('lint_src', () => {
  gulp.src('src/**/*.ts')
    .pipe(tslint({
      formatter: "verbose"
    }))
      .pipe(tslint.report());
});


gulp.task('clean', () => {
  return gulp.src(['lib', 'coverage'], { read: false })
    .pipe(clean());
});

gulp.task('typescript', function() {
  let tsResult = gulp.src('src/**/*.ts')
    .pipe(tsProject())
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
  runSequence('lint_src', done);
});

gulp.task('test', (done) => {
  runSequence('run_tests', 'lint', done);
});

gulp.task('compile', (done) => {
  runSequence('clean', 'typescript', done);
});
