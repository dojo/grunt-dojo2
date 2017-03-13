import registerSuite = require('intern!object');
import { assert } from 'chai';
import * as grunt from 'grunt';
import { join } from 'path';
import { SinonSpy, spy, SinonStub, stub } from 'sinon';
import {
	loadTasks,
	prepareOutputDirectory,
	unloadTasks,
	cleanOutputDirectory,
	runGruntTask,
	getOutputDirectory
} from '../util';

const cachedDeployDocsEnv = process.env.DEPLOY_DOCS;
const outputPath = getOutputDirectory();
const tsconfigPath = join(outputPath, 'tsconfig.json');
const apiDocDirectory = join(outputPath, 'doc');
const apiPubDirectory = join(outputPath, 'pub');

let loadNpmTasks: SinonStub;
let run: SinonStub;
let write: SinonSpy;
let readJSON: SinonStub;
let expandMapping: SinonStub;
let execSync: SinonSpy;
let cp: SinonSpy;
let rm: SinonSpy;
let touch: SinonSpy;
let shouldPush: SinonSpy;
let shouldPushValue: boolean;
let failInitialCheckout: boolean;
let publisherConstructor: SinonSpy;
let publisher: {
	log?: any;
	publish: SinonStub;
	skipPublish?: boolean;
};

registerSuite({
	name: 'tasks/typedoc',

	setup() {
		cp = spy(() => {});
		rm = spy(() => {});
		touch = spy(() => {});
		execSync = spy((command: string) => {
			if (/git checkout/.test(command) && failInitialCheckout) {
				failInitialCheckout = false;
				throw new Error('Failing checkout');
			}
		});
		publisher = {
			publish: stub()
		};
		publisherConstructor = spy(function () {
			return publisher;
		});

		loadTasks({
			'shelljs': {
				config: {},
				cp,
				rm,
				touch
			},
			'./util/exec': {
				'default': execSync
			},
			'./util/Publisher': {
				'default': publisherConstructor
			}
		});

		loadNpmTasks = stub(grunt, 'loadNpmTasks');
		run = stub(grunt.task, 'run');
		write = spy(grunt.file, 'write');
		expandMapping = stub(grunt.file, 'expandMapping', (patterns: string[], base: string) => {
			return [ 'foo' ];
		});
		readJSON = stub(grunt.file, 'readJSON', (filename: string) => {
			return {};
		});
		shouldPush = spy(() => shouldPushValue);

		prepareOutputDirectory();
	},

	teardown() {
		loadNpmTasks.restore();
		write.restore();
		run.restore();
		readJSON.restore();
		expandMapping.restore();

		unloadTasks();
		cleanOutputDirectory();

		process.env.DEPLOY_DOCS = '';
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
						subDirectory: 'api',
						shouldPush
					}
				}
			}
		});

		write.reset();
		execSync.reset();
		shouldPush.reset();
		publisher.publish.reset();
		publisherConstructor.reset();

		shouldPushValue = false;
		failInitialCheckout = false;
	},

	default() {
		runGruntTask('typedoc');
		const command = execSync.args[0][0];
		const matcher = new RegExp(
			`node "[^"]+/typedoc" --mode "modules" --excludeExternals --excludeNotExported ` +
			`--tsconfig "${join(outputPath, 'tsconfig.json')}" ` +
			`--logger "none" --out "${apiDocDirectory}"`);
		assert.match(command, matcher, 'Unexpected typedoc command line');
		assert.strictEqual(shouldPush.callCount, 0, 'Push check should not have been called');
		assert.strictEqual(write.callCount, 0, 'Nothing should have been written');
		assert.strictEqual(execSync.callCount, 1, 'Unexpected number of exec calls');
		assert.isFalse(publisherConstructor.called);
	},

	publish: {
		setup() {
			process.env.DEPLOY_DOCS = 'publish';
		},

		teardown() {
			process.env.DEPLOY_DOCS = cachedDeployDocsEnv;
		},

		test() {
			runGruntTask('typedoc');
			assert.isTrue(publisherConstructor.calledOnce);
			assert.isFalse(publisherConstructor.firstCall.args[2].skipPublish);
			assert.isDefined(publisherConstructor.firstCall.args[2].log);
			assert.isTrue(publisher.publish.calledOnce);
		}
	},

	commit: {
		setup() {
			process.env.DEPLOY_DOCS = 'commit';
		},

		teardown() {
			process.env.DEPLOY_DOCS = cachedDeployDocsEnv;
		},

		test() {
			runGruntTask('typedoc');
			assert.isTrue(publisherConstructor.calledOnce);
			assert.isTrue(publisherConstructor.firstCall.args[2].skipPublish);
			assert.isDefined(publisherConstructor.firstCall.args[2].log);
			assert.isTrue(publisher.publish.calledOnce);
		}
	}
});
