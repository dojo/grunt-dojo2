export = function (grunt: IGrunt) {
	require('../tasks/rename')(grunt);

	return {
		sourceMaps: {
			expand: true,
			cwd: 'dist/umd',
			src: [ '**/*.js.map', '!_debug/**/*.js.map' ],
			dest: 'dist/umd/_debug/'
		},
		sourceMaps_esm: {
			expand: true,
			cwd: 'dist/esm',
			src: [ '**/*.js.map', '!_debug/**/*.js.map' ],
			dest: 'dist/esm/_debug/'
		}
	};
};
