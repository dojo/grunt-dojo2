export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('dts-generator');

	return {
		options: {
			baseDir: 'src',
			name: '<%= name %>'
		},
		dist: {
			options: {
				out: 'dist/umd/<%= name %>.d.ts'
			},
			src: [ '<%= skipTests %>' ]
		}
	};
};
