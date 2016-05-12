export = function (grunt: IGrunt) {
	require('../tasks/rewriteSourceMaps')(grunt);

	return {
		dist: {
			src: [ 'dist/_debug/**/*.js.map' ]
		}
	};
};
