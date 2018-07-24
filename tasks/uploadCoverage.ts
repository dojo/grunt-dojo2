import ITask = grunt.task.ITask;
import { exec } from './util/process';

export = function(grunt: IGrunt) {
	grunt.registerTask('uploadCoverage', <any>function(this: ITask) {
		const codecov = require.resolve('codecov/bin/codecov');
		exec(`node "${codecov}" --file=coverage/coverage.json`);
	});
};
