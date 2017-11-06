import * as vm from 'vm';
import { Context } from 'vm';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
import * as istanbul from 'istanbul-lib-instrument';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

let sandbox: SinonSandbox;
let internMock: any;
let requireMock: any;
let context: Context;
let shimMock: any;
let loaderPromise: Promise<any> | undefined;

const instrumenter = istanbul.createInstrumenter({
	esModules: true
});

const sourceFile = path.resolve(__dirname, '../../../lib/intern/internLoader.js');
const loaderCode = fs.readFileSync(sourceFile).toString();
const instrumentedCode = instrumenter.instrumentSync(loaderCode, sourceFile);

function reportCoverage() {
	intern.emit('coverage', {
		coverage: (<any> context)['__coverage__'],
		source: '',
		sessionId: intern.config.sessionId
	});
}

function runTest(before: Function, after: Function) {
	return new Promise((resolve, reject) => {
		before();
		vm.runInContext(instrumentedCode, context);

		if (loaderPromise) {
			loaderPromise.then((result) => {
				after(result);
				resolve();
			});
		} else {
			setTimeout(() => {
				reportCoverage();

				after();
				resolve();
			}, 100);

		}
	});
}

registerSuite('lib/intern/internLoader', {
	beforeEach() {
		sandbox = sinon.sandbox.create();
		requireMock = sandbox.stub().callsArg(1);
		(<any> requireMock).config = sandbox.stub();

		loaderPromise = undefined;

		internMock = {
			registerLoader: (cb: Function) => {
				loaderPromise = cb({
					baseUrl: '/options'
				});
			},
			loadScript: sandbox.spy(() => Promise.resolve()),
			config: {
				basePath: '/config'
			}
		};

		shimMock = sandbox.stub().returnsArg(0);

		context = vm.createContext({
			intern: internMock,
			require: requireMock,
			shimAmdDependencies: shimMock
		});
	},
	afterEach() {
		sandbox.restore();
	},
	tests: {
		async 'registers the intern loader'() {
			return runTest(() => {
				sandbox.stub(internMock, 'registerLoader');
			}, () => {
				assert.isTrue(internMock.registerLoader.called);
			});
		},

		async 'loads the AMD util'() {
			return runTest(() => {
			}, () => {
				assert.isTrue(internMock.loadScript.calledWith('node_modules/@dojo/loader/loader.js'));
				assert.isTrue(internMock.loadScript.calledWith('node_modules/@dojo/shim/util/amd.js'));
			});
		},

		async 'configures the loader with the baseurl from options'() {
			return runTest(() => {
			}, () => {
				assert.equal(requireMock.config.args[0][0].baseUrl, '/options');
			});
		},

		async 'configures the loader with the baseurl from config'() {
			return runTest(() => {
				sandbox.stub(internMock, 'registerLoader').callsArgWith(0, {});
			}, () => {
				assert.equal(requireMock.config.args[0][0].baseUrl, '/config');
			});
		},

		async 'loads shim/main'() {
			return runTest(() => {
			}, () => {
				assert.equal(requireMock.args[0][0], '@dojo/shim/main');
			});
		},

		async 'creates a loader that uses require'() {
			return new Promise((resolve) => {
				runTest(() => {
				}, (result: any) => {
					result(['some-module']).then(() => {
						assert.isTrue(requireMock.calledWith(['some-module']));
						resolve();
					});
				});
			});
		}
	}
});
