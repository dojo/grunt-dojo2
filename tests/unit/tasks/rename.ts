import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import {
	getInputDirectory,
	getOutputDirectory,
	loadTasks,
	unloadTasks,
	prepareInputDirectory,
	prepareOutputDirectory,
	runGruntTask,
	createDummyFile,
	createDummyDirectory,
	fileExistsInInputDirectory,
	fileExistsInOutputDirectory, cleanInputDirectory, cleanOutputDirectory
} from '../util';

const inputDirectory = getInputDirectory();
const outputPath = getOutputDirectory();

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

		loadTasks();
	},
	teardown() {
		unloadTasks();
	},
	basic: {
		beforeEach() {
			prepareInputDirectory();
			prepareOutputDirectory();
		},

		afterEach() {
			cleanInputDirectory();
			cleanOutputDirectory();
		},

		textFilesOnly() {
			createDummyFile('file1.txt');
			createDummyFile('file2');
			createDummyDirectory('dir.txt');

			runGruntTask('rename:textFiles');

			assert.isFalse(fileExistsInInputDirectory('file1.txt'), 'file1.txt should not be in input directory');
			assert.isTrue(fileExistsInOutputDirectory('file1.txt'), 'file1.txt should have been moved to output directory');
			assert.isTrue(fileExistsInInputDirectory('file2'), 'file2 should still be in input directory');
			assert.isFalse(fileExistsInOutputDirectory('file2'), 'file2 should not be in output directory');
			assert.isFalse(fileExistsInInputDirectory('dir.txt'), 'dir.txt directory should not be in input directory');
			assert.isTrue(fileExistsInOutputDirectory('dir.txt'), 'dir.txt directory should be in output directory');
		}
	}
});
