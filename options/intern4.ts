export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	const progress = grunt.option<boolean>('progress');

	return {
		options: {
			config: '<%= internConfig %>',
			'reporters': [
				{ name: 'runner', options: { 'hideSkipped': !progress, 'hidePassed': !progress } },
				{ name: 'lcov', options: { directory: '.', filename: 'coverage-final.lcov' } },
				{ name: 'htmlcoverage', options: { directory: 'html-report' } }
			]
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
