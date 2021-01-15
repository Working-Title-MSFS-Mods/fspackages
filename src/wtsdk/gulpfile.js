const gulp = require('gulp');
const del = require('del');
const stripImportExport = require('gulp-strip-import-export');
const through2 = require('through2');
const { task } = require('gulp');

function stripImportsExports() {
  return gulp.src(['./.tmp/wtsdk.js'])
    .pipe(stripImportExport())
    .pipe(through2.obj(function (file, enc, cb) {
      if (file.isStream()) {
        throw new Error('Streaming not supported');
      }

      const contents = file.contents.toString().split(/\n/);
      file.contents = Buffer.from(contents.slice(0, -1).join('\n'), 'utf-8');

      this.push(file);
      return cb();
    }, function (cb) { cb(); }))
    .pipe(gulp.dest('dist'));
}

function copy() {
  return gulp.src('./dist/wtsdk.js')
    .pipe(gulp.dest('./../workingtitle-vcockpits-instruments-cj4/html_ui/Pages/VCockpit/Instruments/Airliners/CJ4/WTLibs/', { overwrite: true }));
}

function cleantemp() {
  return del(['./.tmp/']);

}

const dev = gulp.series(stripImportsExports, cleantemp, copy);

exports.develop = dev;

// gulp.task('develop', function () {
//   return gulp.series(stripImportsExports, copythisfuckingshit);
// });

// TODO make it work
// gulp.task('copy',['stripImportsExports'], function (cb) {
//   return gulp.src('./dist/wtsdk.js')
//     .pipe(gulp.dest('./../workingtitle-vcockpits-instruments-cj4/html_ui/Pages/VCockpit/Instruments/Airliners/CJ4/WTLibs/', {overwrite: true}));
// });

gulp.task('clean', function () {
  return del(['./.tmp/', './dist']);
});

gulp.task('clean:temp', function () {
  return del(['./.tmp/']);
});

gulp.task('clean:dist', function () {
  return del(['./dist']);
});
