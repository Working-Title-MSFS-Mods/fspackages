const gulp = require('gulp');
const del = require('del');
const stripImportExport = require('gulp-strip-import-export');
const through2 = require('through2');

gulp.task('stripImportsExports', function () {
  return gulp.src(['./.tmp/wtsdk.js'])
    .pipe(stripImportExport())
    .pipe(through2.obj(function (file, enc, cb) {
      if (file.isStream()) {
        throw new Error('Streaming not supported');
      }

      const contents = file.contents.toString().split(/\n/);
      file.contents = Buffer.from(contents.slice(0, -2).join('\n'), 'utf-8');

      this.push(file);
      return cb();
    }, function (cb) { cb(); })) 
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return del(['./.tmp/', './dist']);
});

gulp.task('clean:temp', function () {
  return del(['./.tmp/']);
});

gulp.task('clean:dist', function () {
  return del(['./dist']);
});