import * as path from 'path';
import { parseJson } from 'intern/lib/common/util';

export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	const progress = grunt.option<boolean>('progress');

	// read the test config and find a loader. if no loader is specified, we need to add ours
	const internJson = grunt.file.read(path.resolve(grunt.config.get('internConfig')));
	const { browser: { loader: browserLoader = undefined } = {}, loader } = parseJson(internJson);

	return {
		options: {
			config: '<%= internConfig %>',
			node: {
				'plugins+': [
					{ script: 'grunt-dojo2/lib/intern/Reporter.js', useLoader: true }
				],
				reporters: [
					{ name: 'runner', options: { 'hideSkipped': !progress, 'hidePassed': !progress } }
				]
			},
			browser: (loader || browserLoader) ? {} : {
				loader: './node_modules/grunt-dojo2/lib/intern/internLoader.js'
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
