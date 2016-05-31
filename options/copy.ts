export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-contrib-copy');

	return {
		staticTestFiles: {
			expand: true,
			cwd: '.',
			src: [ '<%= staticTestFiles %>' ],
			dest: '<%= devDirectory %>'
		},
		staticDefinitionFiles: {
			expand: true,
			cwd: 'src',
			src: [ '<%= staticDefinitionFiles %>' ],
			dest: '<%= distDirectory %>'
		}
	};
};
