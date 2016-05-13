export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('remap-istanbul');

	return {
		coverage: {
			options: {
				reports: {
					'html': 'html-report',
					'text': <any> null
				}
			},
			src: [ 'coverage-unmapped.json' ]
		},
		ci: {
			options: {
				reports: {
					'lcovonly': 'coverage-final.lcov',
					'json': 'coverage-final.json',
					'text': <any> null
				}
			},
			src: [ 'coverage-unmapped.json' ]
		}
	};
};
