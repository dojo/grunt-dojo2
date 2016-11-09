import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import {
	getInputDirectory, loadTasks, prepareInputDirectory, unloadTasks, cleanInputDirectory,
	createDummyFile, runGruntTask, fileExistsInInputDirectory
} from '../util';

const inputDirectory = getInputDirectory();

registerSuite({
	name: 'tasks/fixSourceMaps',
	setup() {
		grunt.initConfig({
			distDirectory: inputDirectory
		});

		loadTasks();
		prepareInputDirectory();
	},
	teardown() {
		unloadTasks();
		cleanInputDirectory();
	},

	sourcMaps() {
		createDummyFile('test/sourcemap.js.map', JSON.stringify(
			{
				"version": 3,
				"file": "global.js",
				"sourceRoot": "",
				"sources": [ "../../src/global.ts" ],
				"names": []
			}
		));

		runGruntTask('fixSourceMaps');

		assert.isTrue(fileExistsInInputDirectory('test/sourcemap.js.map'), 'Source map should still exist');

		const sourceMap = grunt.file.readJSON(inputDirectory + '/test/sourcemap.js.map');

		assert.deepEqual(sourceMap, {
			"version": 3,
			"file": "global.js",
			"sourceRoot": "",
			"sources": [ "global.ts" ],
			"names": []
		});
	}
});
