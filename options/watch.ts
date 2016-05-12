export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-ts');

	return {
		grunt: {
			options: {
				reload: true
			},
			files: [ 'Gruntfile.js', 'tsconfig.json' ]
		},
		src: {
			options: {
				atBegin: true
			},
			files: [ '<%= all %>', '<%= staticTestFiles %>' ],
			tasks: [
				'dev'
			]
		}
	};
};
