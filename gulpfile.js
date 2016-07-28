/* eslint "max-len": ["error", 120] */
var gulp = require('gulp');
var eslint = require('gulp-eslint');

gulp.task('lint', function () {
    return gulp.src(['lib/**/*.js', '*.js'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});
