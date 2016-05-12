/* jshint node:true */

module.exports = function (grunt) {
	require('../tasks/rewriteSourceMaps')(grunt);

	return {
		dist: {
			src: [ 'dist/_debug/**/*.js.map' ]
		}
	};
};
