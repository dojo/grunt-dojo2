export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	const progress = grunt.option<boolean>('progress');

	return {
		options: {
			config: '<%= internConfig %>',
			reporters: [
				{ name: 'runner', options: { 'hideSkipped': !progress, 'hidePassed': !progress } }
			],
			browser: {
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
