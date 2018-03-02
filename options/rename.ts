export = function(grunt: IGrunt) {
	require('../tasks/rename')(grunt);

	const distDirectory = grunt.config.get<string>('distDirectory');

	return {
		sourceMaps: {
			expand: true,
			cwd: distDirectory,
			src: ['**/*.js.map', '!_debug/**/*.js.map'],
			dest: 'dist/umd/_debug/'
		}
	};
};
