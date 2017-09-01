export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	return {
		options: {
			'reporters': [
				{ name: 'runner' },
				{ name: 'lcov', options: { filename: '../coverage-final.lcov' } },
				{ name: 'htmlcoverage' }
			]
		},
		browserstack: {
			options: {
				config: '<%= devDirectory %>/tests/intern-browserstack'
			}
		},
		saucelabs: {
			options: {
				config: '<%= devDirectory %>/tests/intern-saucelabs'
			}
		},
		node: {
			options: {
				config: '<%= devDirectory %>/tests/intern'
			}
		},
		remote: {},
		local: {
			options: {
				config: '<%= devDirectory %>/tests/intern-local'
			}
		},
		proxy: {
			options: {
				proxyOnly: true
			}
		}
	};
};
