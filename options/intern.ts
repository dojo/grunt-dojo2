import * as path from 'path';

export = function(grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	const progress = grunt.option<boolean>('progress');

	return {
		options: {
			config: '<%= internConfig %>',
			node: {
				'plugins+': [{ script: 'grunt-dojo2/lib/intern/Reporter.js', useLoader: true }],
				reporters: [{ name: 'runner', options: { hideSkipped: !progress, hidePassed: !progress } }]
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
		headless: {
			options: {
				config: '<%= internConfig %>@headless'
			}
		},
		serve: {
			options: {
				serveOnly: true
			}
		}
	};
};
