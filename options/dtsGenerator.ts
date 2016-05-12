export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('dts-generator');

	return {
		options: {
			baseDir: 'src',
			name: '<%= name %>'
		},
		dist: {
			options: {
				out: 'dist/_typings/<%= name %>/<%= name %>-<%= version %>.d.ts'
			},
			src: [ '<%= skipTests %>' ]
		}
	};
};
