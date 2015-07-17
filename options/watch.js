/* jshint node:true */

module.exports = function (grunt) {
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
