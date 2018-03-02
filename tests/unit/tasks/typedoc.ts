const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import { join, sep } from 'path';
import { SinonSpy, spy, SinonStub, stub } from 'sinon';
import {
	loadTasks,
	prepareOutputDirectory,
	unloadTasks,
	cleanOutputDirectory,
	runGruntTask,
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
let execSync: SinonSpy;
const cp = stub();
const rm = stub();
const spawnStub = stub();
const touch = stub();
const publishModeStub = stub();
let failInitialCheckout: boolean;
let publisherConstructor: SinonSpy;
let publisher: {
	log?: any;
	init: SinonStub;
	commit: SinonStub;
	publish: SinonStub;
};

function escape(str: string): string {
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

registerSuite('tasks/typedoc', {
	before() {
		execSync = spy((command: string) => {
			if (/git checkout/.test(command) && failInitialCheckout) {
				failInitialCheckout = false;
				throw new Error('Failing checkout');
			}
		});
		publisher = {
			init: stub(),
			publish: stub(),
			commit: stub()
		};
		publisherConstructor = spy(function() {
			return publisher;
		});

		loadTasks({
			shelljs: {
				config: {},
				cp,
				rm,
				touch
			},
			'./util/process': {
				exec: execSync,
				spawn: spawnStub
			},
			'./util/Publisher': {
				default: publisherConstructor
			}
		});

		loadNpmTasks = stub(grunt, 'loadNpmTasks');
		run = stub(grunt.task, 'run');
		write = spy(grunt.file, 'write');
		expandMapping = stub(grunt.file, 'expandMapping', (patterns: string[], base: string) => {
			return ['foo'];
		});
		readJSON = stub(grunt.file, 'readJSON', (filename: string) => {
			return {};
		});
		publisher.commit.returns(true);

		prepareOutputDirectory();
	},

	after() {
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
						publishMode: publishModeStub
					}
				}
			}
		});

		write.reset();
		execSync.reset();
		spawnStub.reset();
		publishModeStub.reset();
		publisher.publish.reset();
		publisher.commit.reset();
		publisher.init.reset();
		publisherConstructor.reset();

		spawnStub.returns({ stdout: '' });
		failInitialCheckout = false;
	},

	tests: {
		default() {
			publishModeStub.returns(false);
			runGruntTask('typedoc');
			const command = execSync.args[0][0];
			const matcher = new RegExp(
				`node "[^"]+${escape(sep)}typedoc" --mode "modules" --excludeExternals --excludeNotExported ` +
					`--tsconfig "${escape(join(outputPath, 'tsconfig.json'))}" ` +
					`--logger "none" --out "${escape(apiDocDirectory)}"`
			);
			assert.match(command, matcher, 'Unexpected typedoc command line');
			assert.strictEqual(write.callCount, 0, 'Nothing should have been written');
			assert.strictEqual(execSync.callCount, 1, 'Unexpected number of exec calls');
			assert.isFalse(publisherConstructor.called);
		},

		publish() {
			publishModeStub.returns('publish');
			runGruntTask('typedoc');
			assert.isTrue(publisherConstructor.calledOnce);
			assert.isDefined(publisherConstructor.firstCall.args[1].log);
			assert.isTrue(publisher.commit.calledOnce);
			assert.isTrue(publisher.publish.calledOnce);
		},

		commit() {
			publishModeStub.returns('commit');
			runGruntTask('typedoc');
			assert.isTrue(publisherConstructor.calledOnce);
			assert.isDefined(publisherConstructor.firstCall.args[1].log);
			assert.isTrue(publisher.commit.calledOnce);
			assert.isFalse(publisher.publish.called);
		}
	}
});
