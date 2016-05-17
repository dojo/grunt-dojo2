# grunt-dojo2

[![Build Status](https://travis-ci.org/dojo/grunt-dojo2.svg?branch=master)](https://travis-ci.org/dojo/grunt-dojo2) [![codecov.io](http://codecov.io/github/dojo/grunt-dojo2/coverage.svg?branch=master)](http://codecov.io/github/dojo/grunt-dojo2?branch=master)
[![npm version](https://badge.fury.io/js/grunt-dojo2.svg)](http://badge.fury.io/js/grunt-dojo2)

A package of Grunt tasks and configuration to use with Dojo 2 Packages.

## Installation

This package contains configuration and tasks for Grunt to help orchestrate development
of Dojo 2 Packages.  It is meant to be a development dependency of a Dojo 2 package.

To install:

```
$ npm install grunt-dojo2 --save-dev
```

The package `Gruntfile.js` should look like this:

```js
module.exports = function (grunt) {
	require('grunt-dojo2').initConfig(grunt);
};
```

### Dependencies

There are several peer dependencies which you should have installed in the containing project:

|Package|SemVer|
|-------|------|
|codecov.io| >=0.1.6|
|dts-generator| >=1.7.0|
|grunt-contrib-clean| >=1.0.0|
|grunt-contrib-copy| >=1.0.0|
|grunt-contrib-watch| >=1.0.0|
|grunt-text-replace| >=0.4.0|
|grunt-typings| >=0.1.4|
|grunt-ts| >=5.0.0|
|grunt-tslint| >=3.0.0|
|remap-istanbul| >=0.6.3|

## Configuration

If you need to customise the Grunt configuration, you can do so by passing a second argument
to the `initConfig()` function.  For example to configure Uglify2, you would do something
like this:

```js
module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-uglify');

	require('grunt-dojo2').initConfig(grunt, {
		uglify: {
			dist: {
				options: {
					sourceMap: true,
					sourceMapName: 'dist/umd/_debug/module.min.js.map',
					sourceMapIncludeSources: true,
					sourceMapIn: 'dist/umd/_debug/module.js.map',
					compress: {
						dead_code: true,
						unsafe: true
					}
				},
				files: {
					'dist/umd/module.min.js': 'dist/umd/module.js'
				}
			}
		}
	});

	grunt.registerTask('dist', grunt.config.get('distTasks').concat('uglify:dist'));
};
```

### Usage

Once configured, there are several Grunt commands that are available.  The default task
will do a development build, including the tests:

```
$ grunt
```

This is also available as `grunt dev`.

To test locally:

```
$ grunt test
```

To build a distribution, there are currently two tasks:

```
$ grunt dist
$ grunt dist_esm
```

The second one should be run after the first one and compiles the package to ES6 modules with
an ES6+ target for TypeScript.
