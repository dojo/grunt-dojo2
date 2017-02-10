import registerSuite = require('intern!object');
import { assert } from 'chai';
import * as grunt from 'grunt';
import { join } from 'path';
import { SinonSpy, spy, SinonStub, stub } from 'sinon';
import {
	loadTasks, prepareOutputDirectory, unloadTasks, cleanOutputDirectory, runGruntTask,
	getOutputDirectory
} from '../util';

const outputPath = getOutputDirectory();
const tsconfigPath = join(outputPath, 'tsconfig.json');
const apiDocDirectory = join(outputPath, 'doc');
const apiPubDirectory = join(outputPath, 'pub');

let loadNpmTasks: SinonStub;
let run: SinonStub;
let write: SinonSpy;
let readJSON: SinonStub;
let expandMapping: SinonStub;
let publishApi: boolean;
let execSync: SinonSpy;
let cp: SinonSpy;
let rm: SinonSpy;
let typedocVersion: string;
let shouldPush: SinonSpy;
let shouldPushValue: boolean;
let failInitialCheckout: boolean;

registerSuite({
	name: 'tasks/typedoc',

	setup() {
		cp = spy(() => {});
		rm = spy(() => {});
		execSync = spy((command: string) => {
			if (/git checkout/.test(command) && failInitialCheckout) {
				failInitialCheckout = false;
				throw new Error('Failing checkout');
			}
		});

		loadTasks({
			'shelljs': {
				config: {},
				cp,
				rm
			},
			'child_process': {
				execSync
			}
		});

		loadNpmTasks = stub(grunt, 'loadNpmTasks');
		run = stub(grunt.task, 'run');
		write = spy(grunt.file, 'write');
		expandMapping = stub(grunt.file, 'expandMapping', (patterns: string[], base: string) => {
			return [ 'foo' ];
		});
		readJSON = stub(grunt.file, 'readJSON', (filename: string) => {
			if (filename.indexOf('package.json') !== -1) {
				return {
					version: typedocVersion
				};
			}
			else {
				return {};
			}
		});
		shouldPush = spy(() => shouldPushValue);

		prepareOutputDirectory();

		publishApi = grunt.option<boolean>('publish-api');
	},

	teardown() {
		loadNpmTasks.restore();
		write.restore();
		run.restore();
		readJSON.restore();
		expandMapping.restore();

		unloadTasks();
		cleanOutputDirectory();

		grunt.option('publish-api', publishApi);
	},

	beforeEach() {
		grunt.initConfig({
			apiDocDirectory,
			apiPubDirectory,
			tsconfig: {
				compilerOptions: {
					inlineSourceMap: true,
					inlineSources: true,
					listFiles: true,
					module: 'commonjs',
					noImplicitAny: true,
					pretty: true,
					target: 'es5'
				}
			},
			typedoc: {
				options: {
					mode: 'modules',
					excludeExternals: true,
					excludeNotExported: true,
					tsconfig: tsconfigPath,
					logger: 'none',
					publishOptions: {
						subdir: 'api',
						shouldPush
					}
				}
			}
		});

		write.reset();
		execSync.reset();
		shouldPush.reset();

		shouldPushValue = false;
		failInitialCheckout = false;
	},

	default: {
		// TODO: Remove this check after updating to TypeDoc 0.5.6+
		'old typedoc'() {
			typedocVersion = '0.5.5';
			runGruntTask('typedoc');
			assert.strictEqual(shouldPush.callCount, 0, 'Push check should not have been called');
			assert.strictEqual(write.callCount, 1, 'One file should have been written');
			assert.strictEqual(execSync.callCount, 1, 'Unexpected number of exec calls');
		},

		'new typedoc'() {
			typedocVersion = '0.5.6';
			runGruntTask('typedoc');
			assert.strictEqual(shouldPush.callCount, 0, 'Push check should not have been called');
			assert.strictEqual(write.callCount, 0, 'Nothing should have been written');
			assert.strictEqual(execSync.callCount, 1, 'Unexpected number of exec calls');
		},

		'typedoc command'() {
			typedocVersion = '0.5.6';
			runGruntTask('typedoc');
			const command = execSync.args[0][0];
			const matcher = new RegExp(
				`node "[^"]+/typedoc" --mode "modules" --excludeExternals --excludeNotExported ` +
				`--logger "none" --out "${apiDocDirectory}" --tsconfig "${join(outputPath, 'tsconfig.json')}"`);
			assert.match(command, matcher, 'Unexpected typedoc command line');
		}
	},

	publish: (() => {
		let publishApi: boolean;

		return {
			setup() {
				publishApi = grunt.option<boolean>('publish-api');
				grunt.option('publish-api', true);
				typedocVersion = '0.5.6';
			},

			teardown() {
				grunt.option('publish-api', publishApi);
			},

			'should push': {
				beforeEach() {
					shouldPushValue = true;
				},

				'gh-pages exists'() {
					runGruntTask('typedoc');
					assert.strictEqual(shouldPush.callCount, 1, 'Push check should have been called once');
					assert.strictEqual(execSync.callCount, 8, 'Unexpected number of exec calls');
				},

				'gh-pages does not exist'() {
					failInitialCheckout = true;
					runGruntTask('typedoc');
					assert.strictEqual(shouldPush.callCount, 1, 'Push check should have been called once');
					// There should be more exec calls when gh-pages doesn't exist
					assert.strictEqual(execSync.callCount, 10, 'Unexpected number of exec calls');
				}
			},

			'should not push': {
				'checker in options'() {
					shouldPushValue = false;
					runGruntTask('typedoc');
					assert.strictEqual(shouldPush.callCount, 1, 'Push check should have been called once');
					assert.strictEqual(execSync.callCount, 1, 'Unexpected number of exec calls');
				},

				'default checker'() {
					// With no shouldPush config value, the default should be not to push
					grunt.config.set('typedoc.options.publishOptions.shouldPush', undefined);
					runGruntTask('typedoc');
					assert.strictEqual(execSync.callCount, 1, 'Unexpected number of exec calls');
				}
			}
		};
	})()
});
