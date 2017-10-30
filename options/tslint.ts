export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-tslint');

	return {
		options: {
			configuration: grunt.file.readJSON('tslint.json')
		},
		src: {
			src: [
				'<%= all %>',
				'!typings/**/*.ts',
				'!tests/typings/**/*.ts',
				'!node_modules/**/*.ts'
			]
		}
	};
};
