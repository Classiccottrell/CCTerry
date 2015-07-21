var gulp = require('gulp');

//utils
var del = require('del');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var replace = require('gulp-batch-replace');
var runSequence = require('run-sequence');
var colors = require('colors/safe');
var imagemin = require('gulp-imagemin');
var critical = require('critical');

//js stuff
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

//sass/css stuff
var sass = require('gulp-sass');
var minifycss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');

//html
var minifyHtml = require('gulp-minify-html');

//live reload
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');

var files = {
	js: {
		deps: [
			//dependencies
			'bower_components/jquery/dist/jquery.js',
			'bower_components/jquery-placeholder/jquery.placeholder.js',
			'bower_components/jquery.cookie/jquery.cookie.js',

			'bower_components/fastclick/lib/fastclick.js',
			'bower_components/wow/dist/wow.js',
			'bower_components/modernizr/modernizr.js',

			//foundation
			'bower_components/foundation/js/foundation/foundation.js',
			//additional foundation libs, uncomment to include
			// 'bower_components/foundation/js/foundation/foundation.abide.js',
			// 'bower_components/foundation/js/foundation/foundation.accordion.js',
			// 'bower_components/foundation/js/foundation/foundation.alert.js',
			// 'bower_components/foundation/js/foundation/foundation.clearing.js',
			// 'bower_components/foundation/js/foundation/foundation.dropdown.js',
			// 'bower_components/foundation/js/foundation/foundation.equalizer.js',
			// 'bower_components/foundation/js/foundation/foundation.interchange.js',
			// 'bower_components/foundation/js/foundation/foundation.joyride.js',
			// 'bower_components/foundation/js/foundation/foundation.magellan.js',
			// 'bower_components/foundation/js/foundation/foundation.offcanvas.js',
			// 'bower_components/foundation/js/foundation/foundation.reveal.js',
			// 'bower_components/foundation/js/foundation/foundation.slider.js',
			// 'bower_components/foundation/js/foundation/foundation.tab.js',
			// 'bower_components/foundation/js/foundation/foundation.tooltip.js',
			// 'bower_components/foundation/js/foundation/foundation.topbar.js',

			//angular
			'bower_components/angular/angular.js',
			'bower_components/angular-cookies/angular-cookies.js',
			'bower_components/angular-resource/angular-resource.js',

			//3rd party
			'bower_components/angular-ui-router/release/angular-ui-router.js',
			// 'bower_components/js-throttle-debounce/build/js-throttle-debounce.min.js',
			// 'bower_components/moment/moment.js',
			// 'bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min.js',
			'bower_components/angular-loading-bar/build/loading-bar.js',

			'bower_components/visionmedia-debug/dist/debug.js'
		],
		app: [
			//widget toolkit
			'src/js/tagga-twt.js',

			//app
			'src/js/app.js',
			'src/js/**/*.js'
		]
	},
	sass: {
		app: [
			'src/scss/app.scss'
		],
		all: [
			'src/scss/**/*.scss'
		],
		includePaths: [
			'bower_components/foundation/scss/'
		]
	},
	html: {
		src: [
			'src/index.html',
			'src/html/**/*.html'
		],
		compiled: [
			'build/index.html',
			'build/html/**/*.html'
		]
	},
	fonts: [
		'src/fonts/*'
	],
	images: [
		'src/img/**/*'
	],
	txt: [
		'src/humans.txt',
		'src/robots.txt'
	],
	files: [
		'src/files/**/*'
	]
};

var errorHandler = function (err) {
	console.log(colors.red('There was an error!'), err.message);
	this.emit('end');
};

gulp.task('clean', function (callback) {
	del(
		[
			'./build/**/*',
			'!./build/.gitignore'
		],
		callback
	);
});

gulp.task('html', function () {
	return gulp.src(files.html.src, {base: './src/'})
		.pipe(minifyHtml({
			quotes: true
		}))
		.pipe(gulp.dest('./build/'))
	;
});

gulp.task('variable-replace', ['html'], function () {
	delete require.cache[require.resolve('./site-config.json')];

	var siteConfig = require('./site-config.json');

	var replaceArray = [];

	for(var key in siteConfig) {
		replaceArray.push([
			new RegExp(key, 'g'),
			siteConfig[key]
		]);
	}

	return gulp.src(files.html.compiled, {base: './build/'})
		.pipe(replace(replaceArray))
		.pipe(gulp.dest('./build/'))
	;
});

gulp.task('critical', ['variable-replace'], function () {
	critical.generate({
		inline: true,
		base: 'build/',
		src: 'index.html',
		dest: 'build/index.html',
		width: 1300,
		height: 900
	});
});

gulp.task('fonts', function () {
	return gulp.src(files.fonts)
		.pipe(gulp.dest('./build/fonts'))
	;
});

gulp.task('txt', function () {
	return gulp.src(files.txt)
		.pipe(gulp.dest('./build'))
	;
});

gulp.task('files', function () {
	return gulp.src(files.files)
		.pipe(gulp.dest('./build/files'))
	;
});

gulp.task('js-deps', function () {
	return gulp.src(files.js.deps)
		.pipe(plumber(errorHandler))
		.pipe(
			uglify({
				beautify: true,
				mangle: false
			}).on('error', function (e) {
				console.log(e);
			})
		)
		.pipe(concat('deps.js'))
		.pipe(gulp.dest('./build/js/'))
	;
});

gulp.task('js', function () {
	return gulp.src(files.js.app)
		.pipe(sourcemaps.init())
		.pipe(plumber(errorHandler))
		.pipe(
			uglify({
				beautify: true,
				mangle: false
			}).on('error', function (e) {
				console.log(e);
			})
		)
		.pipe(concat('app.js'))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./build/js/'))
	;
});

gulp.task('sass', function () {
	return gulp.src(files.sass.app)
		.pipe(sourcemaps.init())
		.pipe(plumber(errorHandler))
		.pipe(sass({
			errorLogToConsole: false,
			includePaths: files.sass.includePaths
		}))
		.pipe(autoprefixer({
			browsers: ['> 1%', 'last 2 versions', 'ie 10']
		}))
		.pipe(minifycss({
			keepSpecialComments: false
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./build/css/'))
		.pipe(browserSync.stream({
			match: '**/*.css'
		}))
	;
});

gulp.task('images', function () {
	return gulp.src(files.images)
		.pipe(imagemin({
			progressive: true
		}))
		.pipe(gulp.dest('./build/img'))
});

gulp.task('nodemon', function (callback) {
	var started = false;

	return nodemon({
		script: './server/server.js',
		watch: [
			'./server/'
		]
	})
		.on('start', function () {
			if( ! started ) {
				started = true;
				return callback();
			}
		});
});

gulp.task('watch', ['default', 'nodemon'], function () {
	var port = process.env.PORT || 5000;

	browserSync({
		proxy: 'http://localhost:' + port,
		open: false
	});

	gulp.watch(files.js.app, ['js', browserSync.reload]);
	gulp.watch(files.sass.all, ['sass']);
	gulp.watch(files.html.src, ['variable-replace', browserSync.reload]);
	gulp.watch('site-config.json', ['variable-replace', browserSync.reload]);
	gulp.watch(files.images, ['images', browserSync.reload]);
});

gulp.task('default', ['clean'], function (callback) {
	runSequence(
		[
			'js-deps',
			'js',
			'sass',
			'fonts',
			'images',
			'html',
			'variable-replace',
			'critical',
			'txt',
			'files'
		],
		callback
	);
});