define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'../util'
], function(registerSuite, assert, grunt, util) {

	var inputDirectory = util.getInputDirectory();

	registerSuite({
		name: 'tasks/fixSourceMaps',
		setup() {
			grunt.initConfig({
				distDirectory: inputDirectory
			});

			util.loadTasks();

			util.prepareInputDirectory();
		},
		teardown() {
			util.unloadTasks();
			util.cleanInputDirectory();
		},

		sourceMaps() {
			util.createDummyFile('test/sourcemap.js.map', JSON.stringify(
				{
					"version": 3,
					"file": "global.js",
					"sourceRoot": "",
					"sources": ["../../src/global.ts"],
					"names": []
				}
			));

			util.runGruntTask('fixSourceMaps');

			assert.isTrue(util.fileExistsInInputDirectory('test/sourcemap.js.map'), 'Source map should still exist');

			const sourceMap = grunt.file.readJSON(inputDirectory + '/test/sourcemap.js.map');

			assert.deepEqual(sourceMap, {
				"version": 3,
				"file": "global.js",
				"sourceRoot": "",
				"sources": ["global.ts"],
				"names": []
			});
		}
	});
});
