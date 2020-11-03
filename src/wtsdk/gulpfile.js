const gulp = require('gulp');
const del = require('del');
const stripImportExport = require('gulp-strip-import-export');

gulp.task('stripImportsExports', function () {
  return gulp.src(['./.tmp/wtsdk.js'])
    .pipe(stripImportExport())
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return del.sync(['./.tmp/', './dest']);
});