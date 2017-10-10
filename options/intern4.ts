export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	return {
		options: {
			config: '<%= internConfig %>',
			'reporters': [
				{ name: 'runner' },
				{ name: 'lcov', options: { filename: '../coverage-final.lcov' } },
				{ name: 'htmlcoverage' }
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
		proxy: {
			options: {
				proxyOnly: true
			}
		}
	};
};
