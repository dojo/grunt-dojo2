import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import { SinonStub, stub } from 'sinon';
import {
	loadTasks, prepareOutputDirectory, unloadTasks, cleanOutputDirectory, runGruntTask,
	getOutputDirectory
} from '../util';

var outputPath = getOutputDirectory();
let run: SinonStub;
let loadNpmTasks: SinonStub;
let write: SinonStub;

registerSuite({
	name: 'tasks/ts',
	setup() {
		loadTasks();

		run = stub(grunt.task, 'run');
		loadNpmTasks = stub(grunt, 'loadNpmTasks');
		write = stub(grunt.file, 'write');

		prepareOutputDirectory();
	},
	teardown() {
		run.restore();
		loadNpmTasks.restore();
		write.restore();

		unloadTasks();
		cleanOutputDirectory();
	},

	beforeEach() {
		grunt.initConfig({
			distDirectory: outputPath,
			tsconfig: {
				"compilerOptions": {
					"inlineSourceMap": true,
					"inlineSources": true,
					"listFiles": true,
					"module": "commonjs",
					"noImplicitAny": true,
					"pretty": true,
					"target": "es6"
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

		run.reset();
		write.reset();
	},

	default() {
		runGruntTask('ts');

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

		runGruntTask('ts:dev');

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
		runGruntTask('ts:dist');

		assert.deepEqual(grunt.config('ts.dist'), {
			tsconfig: {
				passThrough: true,
				tsconfig: '.tsconfigdist.json'
			}
		});

		assert.isTrue(run.calledOnce);
		assert.deepEqual(run.firstCall.args[ 0 ], [ 'ts:dist', 'clean:distTsconfig' ]);

		assert.isTrue(write.calledOnce);
		assert.isTrue(write.calledWith('.tsconfigdist.json'));
	},

	esm() {
		grunt.initConfig({
			distDirectory: outputPath,
			tsconfig: {
				"compilerOptions": {
					"inlineSourceMap": true,
					"inlineSources": true,
					"listFiles": true,
					"module": "commonjs",
					"noImplicitAny": true,
					"pretty": true,
					"target": "es6"
				}
			}
		});

		runGruntTask('ts:esm');

		assert.deepEqual(grunt.config('ts.esm'), {
			tsconfig: {
				passThrough: true,
				tsconfig: '.tsconfigesm.json'
			}
		});

		assert.isTrue(run.calledOnce);
		assert.deepEqual(run.firstCall.args[ 0 ], [ 'ts:esm', 'clean:esmTsconfig' ]);

		assert.isTrue(write.calledOnce);
		assert.isTrue(write.calledWith('.tsconfigesm.json'));
	},

	custom() {
		runGruntTask('ts:custom');

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
});
