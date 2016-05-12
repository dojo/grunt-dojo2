export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('intern');

	return {
		options: {
			runType: 'runner',
			config: '<%= devDirectory %>/tests/intern'
		},
		runner: {
			options: {
				reporters: [ 'runner', 'lcovhtml' ]
			}
		},
		local: {
			options: {
				config: '<%= devDirectory %>/tests/intern-local',
				reporters: [ 'runner', 'lcovhtml' ]
			}
		},
		client: {
			options: {
				runType: 'client',
				reporters: [ 'console', 'lcovhtml' ]
			}
		},
		proxy: {
			options: {
				proxyOnly: true
			}
		}
	};
};
