import * as path from 'path';
import * as glob from 'glob';

exports.initConfig = function (grunt: IGrunt, otherOptions: any) {
	const tsconfigContent = grunt.file.read('tsconfig.json');
	const tsconfig = JSON.parse(tsconfigContent);
	tsconfig.filesGlob = tsconfig.filesGlob.map(function (glob: string) {
		if (/^\.\//.test(glob)) {
			// Remove the leading './' from the glob because grunt-ts
			// sees it and thinks it needs to create a .baseDir.ts which
			// messes up the "dist" compilation
			return glob.slice(2);
		}
		return glob;
	});
	const packageJson = grunt.file.readJSON('package.json');

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

	const options: { [option: string]: any } = {};
	glob.sync('*.js', {
		cwd: path.join(__dirname, 'options')
	}).forEach(function (filename) {
		const optName = path.basename(filename, '.js');
		options[optName] = require('./options/' + optName)(grunt);
	});
	grunt.config.merge(options);

	require('./tasks/updateTsconfig')(grunt);

	if (otherOptions) {
		grunt.config.merge(otherOptions);
	}

	// Set some Intern-specific options if specified on the command line.
	[ 'suites', 'functionalSuites', 'grep' ].forEach(function (option) {
		const value = grunt.option<string>(option);
		let splitValue: string[];
		if (value) {
			if (option !== 'grep') {
				splitValue = value.split(',').map(function (string) { return string.trim(); });
			}
			grunt.config('intern.options.' + option, splitValue || value);
		}
	});

	grunt.registerTask('dev', grunt.config.get<string[]>('devTasks'));
	grunt.registerTask('dist', grunt.config.get<string[]>('distTasks'));
};
