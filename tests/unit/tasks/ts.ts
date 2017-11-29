const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import * as fs from 'fs';
import { sandbox, SinonSandbox, SinonStub } from 'sinon';
import {
	cleanOutputDirectory,
	getOutputDirectory,
	loadTasks,
	prepareOutputDirectory,
	runGruntTask,
	unloadTasks,
} from '../util';

const outputPath = getOutputDirectory();
let mocks: SinonSandbox;
let run: SinonStub;
let loadNpmTasks: SinonStub;
let write: SinonStub;
let expand: SinonStub;
let rename: SinonStub;
let readJSON: SinonStub;
let copy: SinonStub;

registerSuite('tasks/ts', {
	before() {
		grunt.initConfig({
			distDirectory: outputPath
		});

		loadTasks();

		prepareOutputDirectory();
	},
	after() {
		mocks.restore();

		unloadTasks();
		cleanOutputDirectory();
	},

	beforeEach() {
		grunt.initConfig({
			distDirectory: outputPath,
			tsconfig: {
				'compilerOptions': {
					'inlineSourceMap': true,
					'inlineSources': true,
					'listFiles': true,
					'module': 'commonjs',
					'noImplicitAny': true,
					'pretty': true,
					'target': 'es6'
				}
			},
			ts: {
				custom: {
					compilerOptions: {
						target: 'custom'
					}
				}
			}
		});

		mocks = sandbox.create();

		run = mocks.stub(grunt.task, 'run');
		loadNpmTasks = mocks.stub(grunt, 'loadNpmTasks');
		write = mocks.stub(grunt.file, 'write');
		expand = mocks.stub(grunt.file, 'expand');
		rename = mocks.stub(fs, 'renameSync');
		readJSON = mocks.stub(grunt.file, 'readJSON');
		copy = mocks.stub(grunt.file, 'copy');
	},

	afterEach() {
		mocks.restore();
	},

	tests: {
		default() {
			runGruntTask('dojo-ts');

			assert.deepEqual(grunt.config('ts.dev'), {
				tsconfig: {
					passThrough: true,
					tsconfig: 'tsconfig.json'
				}
			});

			assert.isTrue(run.calledOnce);
			assert.deepEqual(run.firstCall.args[ 0 ], [ 'ts:dev' ]);
		},

		dev() {

			runGruntTask('dojo-ts:dev');

			assert.deepEqual(grunt.config('ts.dev'), {
				tsconfig: {
					passThrough: true,
					tsconfig: 'tsconfig.json'
				}
			});

			assert.isTrue(run.calledOnce);
			assert.deepEqual(run.firstCall.args[ 0 ], [ 'ts:dev' ]);
		},

		dist() {
			runGruntTask('dojo-ts:dist');

			assert.isTrue(run.calledOnce);
			assert.deepEqual(run.firstCall.args[ 0 ], [ 'dojo-ts:umd', 'dojo-ts:esm', 'merge-dist' ]);

			expand.onFirstCall().returns(['dist/umd/file1.js']);
			expand.onSecondCall().returns(['dist/esm/file1.mjs']);

			runGruntTask('merge-dist');

			assert.isTrue(copy.calledWith('dist/umd/file1.js', `${outputPath}file1.js`));
			assert.isTrue(copy.calledWith('dist/esm/file1.mjs', `${outputPath}file1.mjs`));
		},

		esm() {
			grunt.initConfig({
				distDirectory: outputPath,
				tsconfig: {
					'compilerOptions': {
						'inlineSourceMap': true,
						'inlineSources': true,
						'listFiles': true,
						'module': 'commonjs',
						'noImplicitAny': true,
						'pretty': true,
						'target': 'es6'
					}
				}
			});

			runGruntTask('dojo-ts:esm');

			assert.deepEqual(grunt.config('ts.esm'), {
				tsconfig: {
					passThrough: true,
					tsconfig: '.tsconfigesm.json'
				}
			});

			assert.isTrue(run.calledOnce);
			assert.deepEqual(run.firstCall.args[0], ['ts:esm', 'clean:esmTsconfig', 'rename-mjs']);

			assert.isTrue(write.calledOnce);
			assert.isTrue(write.calledWith('.tsconfigesm.json'));

			expand.onFirstCall().returns(['file.js']);
			expand.onSecondCall().returns(['file.js.map']);
			expand.onThirdCall().returns(['file.mjs.map']);

			readJSON.returns({
				file: 'file.js',
				key: 'value'
			});

			runGruntTask('rename-mjs');

			assert.isTrue(rename.calledWith('file.js', 'file.mjs'));
			assert.isTrue(rename.calledWith('file.js.map', 'file.mjs.map'));
			assert.isTrue(write.calledWith('file.mjs.map'));

			assert.deepEqual(JSON.parse(write.args[1][1]), {
				file: 'file.mjs',
				key: 'value'
			});
		},

		custom() {
			runGruntTask('dojo-ts:custom');

			assert.deepEqual(grunt.config('ts.custom'), {
				tsconfig: {
					passThrough: true,
					tsconfig: '.tsconfigcustom.json'
				}
			});

			assert.isTrue(run.calledOnce);
			assert.deepEqual(run.firstCall.args[ 0 ], [ 'ts:custom', 'clean:customTsconfig' ]);

			assert.isTrue(write.calledOnce);
			assert.isTrue(write.calledWith('.tsconfigcustom.json'));
			assert.equal(JSON.parse(write.firstCall.args[1]).compilerOptions.target, 'custom');
		}
	}
});
