/* jshint node:true */

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-copy');

	return {
		staticFiles: {
			expand: true,
			cwd: '.',
			src: [ 'README.md', 'LICENSE', 'package.json', 'bower.json' ],
			dest: 'dist/'
		},
		staticTestFiles: {
			expand: true,
			cwd: '.',
			src: [ '<%= staticTestFiles %>' ],
			dest: '<%= devDirectory %>'
		},
		typings: {
			expand: true,
			cwd: 'typings/',
			src: [ '**/*.d.ts', '!tsd.d.ts' ],
			dest: 'dist/_typings/'
		}
	};
};
