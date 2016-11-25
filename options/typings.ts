export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-typings');

	return {
		install: {},
		dev: {
			options: {
				production: false
			}
		},
		dist: {
			options: {
				production: true
			}
		}
	};
};
