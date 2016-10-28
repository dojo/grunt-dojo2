define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'../util'
], function(registerSuite, assert, grunt, util) {

	var coverageFileName = 'coverage-final.lcov';
	var coverageDataSent = '';

	function sendCodeCov(contents, callback) {
		coverageDataSent = contents;
		callback('error');
	}

	registerSuite({
		name: 'tasks/uploadCoverage',
		setup() {
			grunt.initConfig({});

			util.loadTasks({
				'codecov.io/lib/sendToCodeCov.io': sendCodeCov
			});

			grunt.file.write(coverageFileName, JSON.stringify({
				hello: 'world'
			}));
		},
		teardown() {
			util.unloadTasks();

			grunt.file.delete(coverageFileName);
		},
		propagatesReturnValue() {
			var dfd = this.async();

			util.runGruntTask('uploadCoverage', dfd.callback((error) => {
				assert.strictEqual(error, 'error');
				assert.deepEqual(JSON.parse(coverageDataSent), { hello: 'world' });
			}));
		}
	});
});
