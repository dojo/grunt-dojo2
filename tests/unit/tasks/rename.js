define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'../util'
], function(registerSuite, assert, grunt, util) {

	var inputDirectory = util.getInputDirectory();
	var outputPath = util.getOutputDirectory();

	registerSuite({
		name: 'tasks/rename',
		setup() {
			grunt.initConfig({
				rename: {
					textFiles: {
						expand: true,
						cwd: inputDirectory,
						src: ['**/*.txt'],
						dest: outputPath
					}
				}
			});

			util.loadTasks();
		},
		teardown() {
			util.unloadTasks();
		},
		basic: {
			beforeEach() {
				util.prepareInputDirectory();
				util.prepareOutputDirectory();
			},

			afterEach() {
				util.cleanInputDirectory();
				util.cleanOutputDirectory();
			},

			textFilesOnly() {
				util.createDummyFile('file1.txt');
				util.createDummyFile('file2');
				util.createDummyDirectory('dir.txt');

				util.runGruntTask('rename:textFiles');

				assert.isFalse(util.fileExistsInInputDirectory('file1.txt'), 'file1.txt should not be in input directory');
				assert.isTrue(util.fileExistsInOutputDirectory('file1.txt'), 'file1.txt should have been moved to output directory');
				assert.isTrue(util.fileExistsInInputDirectory('file2'), 'file2 should still be in input directory');
				assert.isFalse(util.fileExistsInOutputDirectory('file2'), 'file2 should not be in output directory');
				assert.isFalse(util.fileExistsInInputDirectory('dir.txt'), 'dir.txt directory should not be in input directory');
				assert.isTrue(util.fileExistsInOutputDirectory('dir.txt'), 'dir.txt directory should be in output directory');
			}
		}
	});
});
