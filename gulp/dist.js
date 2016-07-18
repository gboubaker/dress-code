/**
 *
 *
 *
 *  DISTRIBUTION TASKS
 *
 *
 *
 */
var pkg = require('../package.json');
var path = require('path');
var _ = require('lodash');
var eventStream = require('event-stream');
var rimraf = require('rimraf');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var csso = require('gulp-csso');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var conventionalChangelog = require('gulp-conventional-changelog');
var replace = require('gulp-replace');
var header = require('gulp-header');
var helper = require('./util/helper');

// build and copy the result in the official versioned distribution folder (dist)
gulp.task('dist', function (done) {
    return runSequence('lint', 'dist:build', 'dist:clean-dist', 'dist:copy-dist', 'dist:banners', done);
});

// build all distribution artifacts in a tmp folder
gulp.task('dist:build', function (done) {
    return runSequence('dist:clean', ['dist:styles', 'dist:styles:src', 'dist:images', 'dist:icons'], done);
});

gulp.task('dist:banners', function () {
    var bannerTmpl = ['/**',
        ' * @name <%= pkg.name %>',
        ' * @version <%= pkg.version %>',
        ' * @copyright 2015-<%= currYear %> Zalando SE',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */'
    ].join('\n');
    
    var bannerStream = function () {
        return header(bannerTmpl, { pkg : pkg, currYear: new Date().getFullYear() })
    };
    
    var css = gulp.src('dist/css/*.css')
        .pipe(bannerStream())
        .pipe(header('@charset "UTF-8";\n'))
        .pipe(gulp.dest('dist/css'));

    var sass = gulp.src('dist/sass/dress-code.scss')
        .pipe(bannerStream())
        .pipe(gulp.dest('dist/sass'));
        
    return eventStream.concat(css, sass);
});

gulp.task('dist:copy-dist', function () {
    return gulp.src(path.join('.tmp/dist', '/**/*'))
        .pipe(gulp.dest('dist'));
});

gulp.task('dist:clean-dist', function (done) {
    return rimraf('dist', done);
});

gulp.task('dist:clean', function (done) {
    return rimraf('.tmp/dist', done);
});

gulp.task('dist:styles', function () {
    return gulp.src('./src/styles/index.scss')
        .pipe(helper.sass())
        .pipe(replace('@charset "UTF-8";', '')) // FIXME: is sass adding @charset UTF-8 
        .pipe(autoprefixer('last 2 version'))
        .pipe(rename(pkg.name + '.css'))
        .pipe(gulp.dest(path.join('.tmp/dist', 'css')))
        // minified
        .pipe(rename(pkg.name + '.min.css'))
        .pipe(csso())
        .pipe(gulp.dest(path.join('.tmp/dist', 'css')));
});

gulp.task('dist:styles:src', function () {
    return gulp.src(['./src/styles/**/*', '!src/styles/index.scss'])
        .pipe(gulp.dest(path.join('./.tmp/dist', 'sass')));
});


gulp.task('dist:images', function () {
    return gulp.src('./src/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest(path.join('.tmp/dist', '/img')));
});

gulp.task('dist:icons', ['icons'], function () {
    return gulp.src(path.join('.tmp/iconfont', '/fonts/**'))
        .pipe(gulp.dest(path.join('.tmp/dist', '/fonts')));
});

gulp.task('dist:changelog', function() {
    return gulp.src('CHANGELOG.md', {
        buffer: true
    })
    .pipe(conventionalChangelog({ preset: 'angular' }))
    .pipe(gulp.dest('./'));
});
