export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	return {
		options: {
			runType: 'runner',
			config: '<%= devDirectory %>/tests/intern',
			reporters: [ 'Runner' ]
		},
		browserstack: {},
		saucelabs: {
			options: {
				config: '<%= devDirectory %>/tests/intern-saucelabs'
			}
		},
		remote: {},
		local: {
			options: {
				config: '<%= devDirectory %>/tests/intern-local'
			}
		},
		node: {
			options: {
				runType: 'client'
			}
		},
		proxy: {
			options: {
				proxyOnly: true
			}
		}
	};
};
