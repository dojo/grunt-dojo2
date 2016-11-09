import ITask = grunt.task.ITask;
const sendToCodeCov = require('codecov.io/lib/sendToCodeCov.io');

export = function (grunt: IGrunt) {
	grunt.registerTask('uploadCoverage', <any> function (this: ITask) {
		var done = this.async();

		var contents = grunt.file.read('coverage-final.lcov');
		sendToCodeCov(contents, function (err: Error) {
			done(err);
		});
	});
};
