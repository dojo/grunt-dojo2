export = function (grunt: IGrunt) {
	grunt.registerTask('updateTsconfig', <any> function () {
		var tsconfigContent = grunt.config.get<any>('tsconfigContent');
		var tsconfig = JSON.parse(tsconfigContent);
		if (tsconfig.filesGlob) {
			tsconfig.files = grunt.file.expand(tsconfig.filesGlob);

			var output = JSON.stringify(tsconfig, null, '\t') + require('os').EOL;
			if (output !== tsconfigContent) {
				grunt.file.write('tsconfig.json', output);
				grunt.config.set('tsconfigContent', output);
			}
		}
	});
};
