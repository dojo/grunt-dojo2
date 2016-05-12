/* jshint node:true */

module.exports = function (grunt) {
	require('../tasks/rename')(grunt);

	return {
		sourceMaps: {
			expand: true,
			cwd: 'dist/',
			src: [ '**/*.js.map', '!_debug/**/*.js.map' ],
			dest: 'dist/_debug/'
		}
	};
};
