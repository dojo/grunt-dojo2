export = function (grunt: IGrunt) {
	require('../tasks/rewriteSourceMaps')(grunt);

	return {
		dist: {
			src: [ 'dist/umd/_debug/**/*.js.map' ]
		},
		dist_esm: {
			src: [ 'dist/esm/_debug/**/*.js.map' ]
		}
	};
};
