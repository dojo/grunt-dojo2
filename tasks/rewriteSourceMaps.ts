import * as path from 'path';

export = function (grunt: IGrunt) {
	grunt.registerMultiTask('rewriteSourceMaps', function () {
		this.filesSrc.forEach(function (file: string) {
			var map = JSON.parse(grunt.file.read(file));
			map.sources = map.sources.map(function (source: string) {
				return path.basename(source);
			});
			grunt.file.write(file, JSON.stringify(map));
		});
		grunt.log.writeln('Rewrote ' + this.filesSrc.length + ' source maps');
	});
};
