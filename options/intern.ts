import * as path from 'path';
import * as fs from 'fs';

export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	const progress = grunt.option<boolean>('progress');

	// packages can override the built-in loader and provide their own
	const customLoaderPath = path.resolve('./_build/tests/internLoader.js');

	return {
		options: {
			config: '<%= internConfig %>',
			reporters: [
				{ name: 'runner', options: { 'hideSkipped': !progress, 'hidePassed': !progress } }
			],
			browser: {
				loader: `${fs.existsSync(customLoaderPath) ? './_build/tests' : './node_modules/grunt-dojo2/lib/intern'}/internLoader.js`
			}
		},
		browserstack: {
			options: {
				config: '<%= internConfig %>@browserstack'
			}
		},
		saucelabs: {
			options: {
				config: '<%= internConfig %>@saucelabs'
			}
		},
		node: {},
		remote: {},
		local: {
			options: {
				config: '<%= internConfig %>@local'
			}
		},
		serve: {
			options: {
				serveOnly: true
			}
		}
	};
};
