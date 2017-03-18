import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { SinonStub, SinonSpy, stub, spy } from 'sinon';
import { Options, default as PublisherInstance } from 'grunt-dojo2/tasks/util/Publisher';
import { unloadTasks, loadModule } from 'grunt-dojo2/tests/unit/util';

const cloneDir = '_tests/cloneDir';
const generatedDocsDir = '_tests/generatedDocsDir';
const cpStub: SinonStub = stub();
const rmStub: SinonStub = stub();
const chmodStub: SinonStub = stub();
const spawnStub: SinonSpy = spy( () => {
	return { stdout: '' };
});
const execStub: SinonStub = stub();
const existsStub: SinonStub = stub();
let Publisher: typeof PublisherInstance;

registerSuite({
	name: 'tasks/util/Publisher',

	setup() {
		const mocks = {
			'shelljs': {
				config: {},
				cp: cpStub,
				rm: rmStub
			},
			fs: {
				chmodSync: chmodStub,
				existsSync: existsStub
			},
			'./process': {
				'exec': execStub,
				'spawn': spawnStub
			}
		};
		Publisher = loadModule('grunt-dojo2/tasks/util/Publisher', mocks);
	},

	beforeEach() {
		cpStub.reset();
		execStub.reset();
		spawnStub.reset();
		rmStub.reset();
		chmodStub.reset();
		existsStub.reset();
	},

	teardown() {
		unloadTasks();
	},

	construct: {
		'no overrides'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir);

			assert.strictEqual(publisher.branch, 'gh-pages');
			assert.strictEqual(publisher.cloneDirectory, cloneDir);
			assert.strictEqual(publisher.deployKey, 'deploy_key');
			assert.isDefined(publisher.log);
			assert.isTrue(publisher.url.indexOf('git@github.com') >= 0);
		},

		'with overrides'() {
			const overrides: Options = {
				branch: 'branch',
				deployKey: 'deployKey',
				log: { writeln: stub() },
				url: 'tacos'
			};
			const publisher = new Publisher(cloneDir, overrides);

			assert.strictEqual(publisher.branch, overrides.branch);
			assert.strictEqual(publisher.cloneDirectory, cloneDir);
			assert.strictEqual(publisher.deployKey, overrides.deployKey);
			assert.deepEqual(publisher.log, overrides.log);
			assert.strictEqual(publisher.url, overrides.url);
		},

		'default logger'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			publisher.log.writeln('hi');
		}
	},

	hasDeployCredentials: {
		'missing deployKey; returns false'() {
			existsStub.returns(false);
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isFalse(publisher.hasDeployCredentials());
		},

		'deployKey is present; returns true'() {
			existsStub.returns(true);
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isTrue(publisher.hasDeployCredentials());
		}
	},

	init() {
		existsStub.onFirstCall().returns(true);
		const log = { writeln: stub() };
		const publisher = new Publisher(cloneDir, { log });
		publisher.init();

		assert.include(log.writeln.lastCall.args[0], 'Cloning');
	},

	commit() {
		existsStub.onFirstCall().returns(false);
		const log = { writeln: stub() };
		const publisher = new Publisher(cloneDir, { log });
		publisher.commit();

		assert.include(execStub.getCall(0).args[0], 'git status');
		assert.include(execStub.getCall(1).args[0], 'git add');
		assert.include(execStub.lastCall.args[0], 'git commit -m');
	},

	publish() {
		existsStub.returns(true);
		const log = { writeln: stub() };
		const publisher = new Publisher(cloneDir, { log });
		publisher.publish();

		assert.strictEqual(log.writeln.lastCall.args[0], 'Pushed gh-pages to origin');
	}
});
