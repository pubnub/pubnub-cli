/* eslint "max-len": ["error", 120] */
var gulp = require('gulp');
var eslint = require('gulp-eslint');

var customInstrumenter = function (fileOpts) {

    var instrumenter = new istanbul.Instrumenter(fileOpts);

    return {
        instrument: function (fileContents, filePath, callback) {
            fileContents = 'module.exports = ' + fileContents;
            return instrumenter.instrument(fileContents, filePath, callback);
        },
        lastSourceMap: function () {
            return instrumenter.lastSourceMap();
        }
    };
};

gulp.task('lint', function () {
    return gulp.src(['lib/**/*.js', '*.js'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});
