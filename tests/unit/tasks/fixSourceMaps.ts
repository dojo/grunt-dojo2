const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import {
	getInputDirectory, loadTasks, prepareInputDirectory, unloadTasks, cleanInputDirectory,
	createDummyFile, runGruntTask, fileExistsInInputDirectory
} from '../util';

const inputDirectory = getInputDirectory();

registerSuite('tasks/fixSourceMaps', {
	before() {
		grunt.initConfig({
			distDirectory: inputDirectory
		});

		loadTasks();
		prepareInputDirectory();
	},
	after() {
		unloadTasks();
		cleanInputDirectory();
	},

	tests: {
		sourceMaps() {
			createDummyFile('test/sourcemap.js.map', JSON.stringify(
				{
					'version': 3,
					'file': 'global.js',
					'sourceRoot': '',
					'sources': [ '../../src/global.ts' ],
					'names': []
				}
			));

			runGruntTask('fixSourceMaps');

			assert.isTrue(fileExistsInInputDirectory('test/sourcemap.js.map'), 'Source map should still exist');

			const sourceMap = grunt.file.readJSON(inputDirectory + '/test/sourcemap.js.map');

			assert.deepEqual(sourceMap, {
				'version': 3,
				'file': 'global.js',
				'sourceRoot': '',
				'sources': [ 'global.ts' ],
				'names': []
			});
		}
	}
});
