var gulp = require('gulp'),
    gp_concat = require('gulp-concat'),
    gp_rename = require('gulp-rename'),
    gp_uglify = require('gulp-uglify'),
    gp_concatcss = require('gulp-concat-css'),
    gp_cleancss = require('gulp-clean-css'),
    gp_sourcemaps = require('gulp-sourcemaps');

var jsAssets = [
    'assets/js/fetch.js',
    'assets/js/moment.js',
    'assets/js/lz-string.js',
    'assets/js/jquery.js',
    'assets/js/spin.js',
    'assets/js/jquery.spin.js',
    'assets/js/selectize.js',
    'assets/js/fullcalendar.js',
    'assets/js/canvas-toBlob.js',
    'assets/js/FileSaver.js',
    'assets/js/ics.js',
    'assets/js/plotly-basic.js'
];

var cssAssets = 'assets/css/*.css';

gulp.task('js', function() {
    return gulp.src(jsAssets)
        .pipe(gp_sourcemaps.init())
        .pipe(gp_concat('assets.js'))
        .pipe(gulp.dest('public'))
        .pipe(gp_rename('assets.min.js'))
        .pipe(gp_uglify())
        .pipe(gp_sourcemaps.write('./'))
        .pipe(gulp.dest('public'));
});

gulp.task('css', function() {
    return gulp.src(cssAssets)
        .pipe(gp_sourcemaps.init())
        .pipe(gp_concatcss('style.css'))
        .pipe(gulp.dest('public'))
        .pipe(gp_rename('style.min.css'))
        .pipe(gp_cleancss({compatibility: 'ie8'}))
        .pipe(gp_sourcemaps.write('./'))
        .pipe(gulp.dest('public'));
});

gulp.task('default', ['js', 'css'], function() {});
