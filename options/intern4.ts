export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	return {
		options: {
			config: '<%= internConfig %>',
			'reporters': [
				{ name: 'runner' },
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
