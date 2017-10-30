const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import * as fs from 'fs';
import * as path from 'path';
import { SinonStub, stub } from 'sinon';
import {
	getOutputDirectory, loadTasks, unloadTasks, runGruntTask, prepareOutputDirectory,
	cleanOutputDirectory
} from '../util';

const outputPath = getOutputDirectory();
const cwd = process.cwd();

let symlink: SinonStub;
let shell: SinonStub = stub();
let run: SinonStub;

registerSuite('tasks/link', {
	before() {
		grunt.initConfig({
			distDirectory: outputPath
		});

		symlink = stub(fs, 'symlink');

		shell.withArgs(
			'npm link',
			{
				cwd: outputPath
			}
		).returns(
			Promise.resolve({
				stdout: ''
			})
		);

		loadTasks({
			fs: fs,
			execa: {
				shell: shell
			}
		});
	},
	after() {
		symlink.restore();
		unloadTasks();
	},

	beforeEach() {
		symlink.reset();
		shell.reset();
	},

	tests: {
		_link() {
			runGruntTask('_link');

			assert.isTrue(symlink.calledTwice);
			assert.isTrue(symlink.firstCall.calledWith(path.join(cwd, 'node_modules'), path.join(outputPath, 'node_modules'), 'junction'));
			assert.isTrue(symlink.secondCall.calledWith(path.join(cwd, 'package.json'), path.join(outputPath, 'package.json'), 'file'));
			assert.isTrue(shell.calledOnce);
			assert.isTrue(shell.calledWith('npm link', { cwd: outputPath }));
		},

		link: {
			beforeEach() {
				run = stub(grunt.task, 'run');
			},
			afterEach() {
				run.restore();
			},

			tests: {
				withDir() {
					prepareOutputDirectory();

					runGruntTask('link');

					cleanOutputDirectory();

					assert.isTrue(run.calledOnce);
					assert.deepEqual(run.firstCall.args[ 0 ], [ '_link' ]);
				},

				withoutDir() {
					cleanOutputDirectory();

					runGruntTask('link');

					assert.isTrue(run.calledOnce);
					assert.deepEqual(run.firstCall.args[ 0 ], [ 'dist', '_link' ]);
				}
			}
		}
	}
});
