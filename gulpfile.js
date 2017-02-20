const gulp = require("gulp");
const gulpTypeScript = require("gulp-typescript");
const typescript = require("typescript");
const del = require("del");

const sources = ["src/**/*.ts"];
const output = "lib";

const compileProject = gulpTypeScript.createProject("./tsconfig.json", { typescript });

gulp.task("compile", () =>
    gulp.src(sources)
       .pipe(compileProject())
       .pipe(gulp.dest(output)));

gulp.task("watch-compile", ["compile"], () =>
    gulp.watch(sources, ["compile"]));

gulp.task("clean", () =>
    del([output]));
