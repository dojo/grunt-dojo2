var fs = require('fs');
var path = require('path');
var glob = require('glob');

exports.initConfig = function (grunt, otherOptions) {
	var tsconfigContent = grunt.file.read('tsconfig.json');
	var tsconfig = JSON.parse(tsconfigContent);
	tsconfig.filesGlob = tsconfig.filesGlob.map(function (glob) {
		if (/^\.\//.test(glob)) {
			// Remove the leading './' from the glob because grunt-ts
			// sees it and thinks it needs to create a .baseDir.ts which
			// messes up the "dist" compilation
			return glob.slice(2);
		}
		return glob;
	});
	var packageJson = grunt.file.readJSON('package.json');

	grunt.initConfig({
		name: packageJson.name,
		version: packageJson.version,
		tsconfig: tsconfig,
		tsconfigContent: tsconfigContent,
		all: [ '<%= tsconfig.filesGlob %>' ],
		skipTests: [ '<%= all %>' , '!tests/**/*.ts' ],
		staticTestFiles: 'tests/**/*.{html,css,json,xml}',
		devDirectory: '<%= tsconfig.compilerOptions.outDir %>',

		devTasks: [
			'ts:dev',
			'copy:staticTestFiles',
			'replace:addIstanbulIgnore',
			'updateTsconfig'
		],
		distTasks: [
			'ts:dist',
			'rename:sourceMaps',
			'rewriteSourceMaps',
			'copy:typings',
			'copy:staticFiles',
			'dtsGenerator:dist'
		]
	});

	var options = {};
	glob.sync('*.js', {
		cwd: path.join(__dirname, 'options')
	}).forEach(function (filename) {
		var optName = path.basename(filename, '.js');
		options[optName] = require('./options/' + optName)(grunt);
	});
	grunt.config.merge(options);

	require('./tasks/updateTsconfig')(grunt);
	
	if (otherOptions) {
		grunt.config.merge(otherOptions);
	}

	// Set some Intern-specific options if specified on the command line.
	[ 'suites', 'functionalSuites', 'grep' ].forEach(function (option) {
		var value = grunt.option(option);
		if (value) {
			if (option !== 'grep') {
				value = value.split(',').map(function (string) { return string.trim(); });
			}
			grunt.config('intern.options.' + option, value);
		}
	});

	grunt.registerTask('dev', grunt.config.get('devTasks'));
	grunt.registerTask('dist', grunt.config.get('distTasks'));
};
