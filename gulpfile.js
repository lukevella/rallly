var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var notify = require('gulp-notify');

gulp.task('js', function () {
    gulp.src(['public/js/**/module.js', 'public/js/**/*.js'])
    .pipe(sourcemaps.init())
        .pipe(concat('public/build/app.js'))
        .pipe(ngAnnotate())
        .on('error', notify.onError(function (error) {
            return error.message;
        }))
        .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(notify("Javascript compiled!"))
    .pipe(gulp.dest('./'))
});

gulp.task('sass', function(){
    gulp.src('public/scss/*.scss')
    .pipe(sourcemaps.init())
        .pipe(sass({outputStyle:'compressed'}))
        .on('error', notify.onError(function (error) {
            return error.message;
        }))
    .pipe(sourcemaps.write('.'))
    .pipe(notify("CSS compiled!"))
    .pipe(gulp.dest('public/css'))
});

gulp.task('watch', ['js','sass'], function () {
    gulp.watch('public/scss/**/*.scss', ['sass'])
    gulp.watch('public/js/**/*.js', ['js'])
});
