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

### Tasks

#### grunt tslint

The `grunt tslint` task, runs tslint with the following configuration.

```
options: {
	configuration: grunt.file.readJSON('tslint.json')
},
src: {
	src: [
		'<%= all %>',
		'!typings/**/*.ts',
		'!tests/typings/**/*.ts',
		'!node_modules/**/*.ts'
	]
}
```

#### grunt ts

The `grunt ts` task is preconfigured with to targets, `dev` and `dist`. The tasks both use the a projects `tsconfig.json` but the `dist` task applies the following specific overrides:

```
{
	compilerOptions: {
		outDir: distDirectory,
		declaration: true
	},
	exclude: ['tests/**/*.ts']
}
```

Where the `distDirectory` is defaulted to `dist/umd`.

It is possible to create custom targets for the `ts` by adding an entry to the grunt config, such as:

```
"ts": {
	"custom": {
		"compilerOptions": {
			"target": "es6",
			"module": "commonjs"
		}
	}
}
```

The custom ts config can be run using `grunt ts:custom`.

#### grunt intern

The intern task provides multiple preconfigured targets

```
options: {
	runType: 'runner',
	config: '<%= devDirectory %>/tests/intern',
	reporters: [ 'Runner' ]
},
browserstack: {},
	saucelabs: {
		options: {
			config: '<%= devDirectory %>/tests/intern-saucelabs'
		}
	},
remote: {},
local: {
	options: {
		config: '<%= devDirectory %>/tests/intern-local',
	}
},
node: {
	options: {
		runType: 'client'
	}
},
proxy: {
	options: {
		proxyOnly: true
	}
}
```

#### grunt doc

The `doc` task is used to automatically build and publish API documentation to the project's GitHub pages. Please note
that if you want to generate documentation locally by manually running this command use the `grunt typedoc` command 
instead.

##### Environment Variables

Running `grunt typedoc` (part of `grunt doc`) will only generate APIs using typedoc. In order to 
 automatically commit or publish API documentation the `DEPLOY_DOCS` environment variable must be set to either 
 `publish` or `commit`. Environment variables are used so they may be turned on/off using travis-ci settings and to 
 support forks that may want to use the travis build, but do not want to automatically publish documentation.

##### Prerequisites

To support continuous delivery of API documents to your project's GitHub pages Travis-ci needs access to your GitHub
repository. This is best achieved by supplying an encrypted deployment key that can be used via SSH (there are other
methods that are less secure that we will not go into). To use this method you will need to:

1. Create a ssh key; e.g. `ssh-keygen -t rsa -C "your_email@example.com"`
1. encrypt the private key using travis cli; e.g. `travis encrypt-file deploy_key` (you will need to be logged in and
	be the owner of the GitHub repository to do this)
1. add the public key under your project's GitHub settings
1. add `grunt doc --publish-api` as part of your `install` steps

#### grunt link

The link task is designed to ease the local development and testing of changes that span multiple packages. Traditionally `npm link` can be used but this assumes that the project structure is the same as the distribution, which for dojo2 projects is not the case. 

This command emulates the behaviour of `npm link` but with some additional steps to ensure that the linked structure matches that of the distributed package.

Once `grunt link` has been run within a dojo2 package, `npm link` can be used as normal to created the linked package dependency.

*Example*

```shell
npm link dojo-widgets
```

#### grunt release

The release task automates all the steps involved in building, tagging and publishing a dojo2 package.

```shell
grunt release --pre-release-tag=alpha
```

**note:** 

1. Task runs the `dist` pipelines as a prerequisite.
2. Requires being logged into NPM unless using the `dry-run` options

#####Options

The `pre-release-tag` is required, the other options are all optional.

- `pre-release-tag`- determines the pre-release tag used for the published version (usually `alpha`, `beta` or `rc`)
- `dry-run` - performs the release in dry run mode, no commits, tags or publishing occur. The generated package is built into the `dist` directory.
- `initial` - indicates that it is an initial release of an asset and therefore assumes the version rather than using `npm veiw`.
- `skip-checks` - skips checks against the registered maintainers, only available with `dry-run`
- `push-back` - automatically pushes back to github (tags and commits)

### Pipelines

#### dev

The running `grunt dev` will execute the dev pipeline which as follows:

- `clean:typings`
- `typings`
- `tslint`
- `clean:dev`
- `ts:dev`
- `copy:staticTestFiles`

#### dist

The running `grunt dist` will execute the dist pipeline which as follows:

- `clean:typings`
- `typings`
- `tslint`
- `clean:dist`
- `ts:dist`

#### doc

Running `grunt doc` will execute the doc pipeline, which comes from the `docTasks` configuration:

- `clean:typings`
- `typings:dev`
- `typedoc`
- `clean:typedoc`
- `clean:ghpages`

#### test

The running `grunt test` will execute the test pipeline which as follows:

- `clean:coverage`
- `dev`
- `intern:node`
- `remapIstanbul:coverage`
- `clean:coverage`

#### Default (grunt)

Running `grunt` will execute the default pipeline which as follows:

- `clean`
- `dev`

