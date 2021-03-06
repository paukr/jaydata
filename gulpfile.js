﻿require('babel/register');
var browserify = require('browserify');
var config = require('./build/config.json');
var pkg = require('./package.json');
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minimist = require('minimist');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var header = require('gulp-header');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var closureCompiler = require('gulp-closure-compiler');
var derequire = require('browserify-derequire');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var fs = require('fs');
var karma = require('karma').server;
var exec = require('child_process').exec;
var eslint = require('gulp-eslint');
var header = require('gulp-header');
var footer = require('gulp-footer');

config.options = minimist(process.argv.slice(2), config.buildDefaultOptions);
var paths = {
  js: ['src/**/*.js'],
  test: ['test/**/*.js']
}

gulp.task('default', ['all']);

gulp.task('lint', function(){
    return gulp.src(['src/**/*.js'])
    .pipe(eslint({
        parser: 'babel-eslint',
        env: {
            browser: true,
            node: true,
            es6: true
        },
        ecmaFeatures: {
            modules: true
        },
        rules: {
            'no-undef': 1,
            'no-unused-vars': 1,
            'no-use-before-define': 1
        }
    }))
    .pipe(eslint.format('compact', fs.createWriteStream('./dist/.eslint')))
    .pipe(eslint.failAfterError())
});

gulp.task('nodejs', function() {
    return gulp.src(['src/**/*.js'])
    .pipe(babel({
        compact: false
    }))
    .pipe(gulp.dest('./dist/lib'))
    .on('error', function(err){
		console.log('>>> ERROR', err);
		this.emit('end');
	});
});

gulp.task('jaydata.min', function(){
    return gulp.src('./dist/public/jaydata.js')
    .pipe(closureCompiler({
        compilerPath: './node_modules/google-closure-compiler/compiler.jar',
        fileName: 'dist/public/jaydata.min.js'
    }))
    .pipe(gulp.dest('./dist/public'));
});

gulp.task('test', ['bundle'], function(done){
    karma.start({
    	configFile: __dirname + '/karma.conf.js',
    	singleRun: true
    }, function(){
        done();
    });
});

gulp.task('apidocs', ['jaydata'], function (cb) {
    exec('node_modules\\.bin\\jsdoc dist\\public\\jaydata.js -t node_modules\\jaguarjs-jsdoc -d apidocs', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});


for (var i = 0; i < config.components.length; i++) {
  (function(td) {
    if (td.browserify) {
      gulp.task(td.taskName, td.dependencies, function() {
        return gulpTask(td, config);
      });
    } else {
      gulp.task(td.taskName, td.dependencies);
    }
  })(config.components[i]);
}

function gulpTask(td, config){

    var task = browserify(td.browserify).transform(babelify.configure({
        compact: false
    }));
    task = task.require.apply(task, td.require);

    if(td.external){
        for (var i = 0; i < td.external.length; i++){
            task = task.external(td.external[i]);
        }
    }

    if(td.ignore){
        for (var i = 0; i < td.ignore.length; i++){
            task = task.ignore(td.ignore[i]);
        }
    }

    task = task.bundle()
        .on("error", function (err) { console.log("Error: " + err.message) })
        .pipe(source(td.destFile))
        .pipe(buffer());

    if(config.options.min){
        task = task.pipe(uglify());
    }

    if (td.header){
        task = task.pipe(header(fs.readFileSync(td.header, 'utf8'), { pkg: pkg }));
    }
    task = task.pipe(header(fs.readFileSync('./build/CREDITS.txt'), pkg));

    if (td.footer){
        task = task.pipe(footer(fs.readFileSync(td.footer, 'utf8'), { pkg: pkg }));
    }

    task = task.pipe(gulp.dest(td.destFolder));

    return task;

}
