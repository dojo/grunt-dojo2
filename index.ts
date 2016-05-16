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

	const devTasks = [
		'typings',
		'tslint',
		'clean:dev',
		'ts:dev',
		'copy:staticTestFiles',
		'updateTsconfig'
	];

	const distTasks = [
		'typings',
		'tslint',
		'clean:dist',
		'ts:dist',
		'rename:sourceMaps',
		'rewriteSourceMaps:dist',
		'dtsGenerator:dist',
	];

	const distESMTasks = [
		'ts:dist_esm'
	];

	grunt.initConfig({
		name: packageJson.name,
		version: packageJson.version,
		tsconfig: tsconfig,
		tsconfigContent: tsconfigContent,
		all: [ '<%= tsconfig.filesGlob %>' ],
		skipTests: [ '<%= all %>' , '!tests/**/*.ts' ],
		staticTestFiles: 'tests/**/*.{html,css,json,xml,js}',
		devDirectory: '<%= tsconfig.compilerOptions.outDir %>',

		devTasks,
		distTasks,
		distESMTasks
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

	function setCombined(combined: boolean) {
		if (combined) {
			grunt.config('intern.options.reporters', [
				/* TODO: Migrate the reporter to this package */
				{ id: 'tests/support/Reporter', file: 'coverage-unmapped.json' }
			]);
		}
	}
	setCombined(grunt.option<boolean>('combined'));

	grunt.registerTask('test', <any> (function () {
		const flags = Object.keys(this.flags);

		if (!flags.length) {
			flags.push('node');
		}

		grunt.option('force', true);
		grunt.task.run('clean:coverage');
		grunt.task.run('dev');
		setCombined(true);
		flags.forEach((flag) => {
			grunt.task.run('intern:' + flag);
		});
		grunt.task.run('remapIstanbul:coverage');
		grunt.task.run('clean:coverage');
	}));

	grunt.registerTask('dev', grunt.config.get<string[]>('devTasks'));
	grunt.registerTask('dist', grunt.config.get<string[]>('distTasks'));
	grunt.registerTask('dist_esm', grunt.config.get<string[]>('distESMTasks'));

	grunt.registerTask('default', [ 'clean', 'dev' ]);
};
