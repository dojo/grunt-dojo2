export = function (grunt: IGrunt) {

	/**
	 * When compiling with --inlineSources, tsc generates sources which include folder
	 * paths. Until this is fixed, we need to remove paths leaving just the filename.
	 *
	 * ie '../../src/has.ts' -> 'has.ts'
	 *
	 * @param sourceMap input source map
	 * @return modified source map
	 */
	function fixSources(sourceMap: any): any {
		sourceMap.sources = sourceMap.sources.map((source: string) => source.replace(/.*\//, ''));
		return sourceMap;
	}

	grunt.registerTask('fixSourceMaps', <any> function () {
		const dist = grunt.config('distDirectory');
		const fixers = [ fixSources ];
		grunt.file.expand({ filter: 'isFile'}, [dist + '/**/*.js.map']).forEach(function(path) {
			const inputSourceMap = grunt.file.readJSON(path);
			const outputSourceMap = fixers.reduce((sourceMap, fixer) => fixer(sourceMap), inputSourceMap);
			grunt.file.write(path, JSON.stringify(outputSourceMap));
		});
	});
};
