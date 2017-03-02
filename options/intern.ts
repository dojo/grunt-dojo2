export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	return {
		options: {
			runType: 'runner',
			config: '<%= devDirectory %>/common/tests/intern',
			reporters: [ 'Runner' ]
		},
		browserstack: {},
		saucelabs: {
			options: {
				config: '<%= devDirectory %>/common/tests/intern-saucelabs'
			}
		},
		remote: {},
		local: {
			options: {
				config: '<%= devDirectory %>/common/tests/intern-local',
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
