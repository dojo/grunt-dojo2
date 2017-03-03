import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { SinonStub, stub, spy } from 'sinon';
import { Options, default as PublisherInstance } from 'grunt-dojo2/tasks/util/Publisher';
import { unloadTasks, loadModule } from 'grunt-dojo2/tests/unit/util';
import { existsSync } from 'fs';

const cachedTravisBranchEnv = process.env.TRAVIS_BRANCH;
const cloneDir = '_tests/cloneDir';
const generatedDocsDir = '_tests/generatedDocsDir';
const cpStub: SinonStub = stub();
const rmStub: SinonStub = stub();
const chmodStub: SinonStub = stub();
const execStub: SinonStub = stub();
const existsStub: SinonStub = stub();
let Publisher: typeof PublisherInstance;

function assertCommit() {
	assert.isTrue(execStub.called);
	assert.isTrue(rmStub.called);
	assert.isTrue(cpStub.called);
}
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
			'./exec': {
				'default': execStub
			}
		};
		Publisher = loadModule('grunt-dojo2/tasks/util/Publisher', mocks);
	},

	beforeEach() {
		cpStub.reset();
		execStub.reset();
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
			assert.strictEqual(publisher.cloneDir, cloneDir);
			assert.strictEqual(publisher.deployKey, false);
			assert.strictEqual(publisher.generatedDocsDirectory, generatedDocsDir);
			assert.isDefined(publisher.log);
			assert.isFalse(publisher.skipPublish);
			assert.strictEqual(publisher.subDirectory, 'api');
			assert.isTrue(publisher.url.indexOf('git@github.com') >= 0);
			assert.strictEqual(publisher.shouldPush, Publisher.prototype.shouldPush);
		},

		'with overrides'() {
			const overrides: Options = {
				branch: 'branch',
				deployKey: 'deployKey',
				log: { writeln: stub() },
				skipPublish: true,
				shouldPush: () => false,
				subDirectory: 'subDirectory',
				url: 'tacos'
			};
			const publisher = new Publisher(cloneDir, generatedDocsDir, overrides);

			assert.strictEqual(publisher.branch, overrides.branch);
			assert.strictEqual(publisher.cloneDir, cloneDir);
			assert.strictEqual(publisher.deployKey, overrides.deployKey);
			assert.strictEqual(publisher.generatedDocsDirectory, generatedDocsDir);
			assert.deepEqual(publisher.log, overrides.log);
			assert.isTrue(publisher.skipPublish);
			assert.strictEqual(publisher.subDirectory, overrides.subDirectory);
			assert.strictEqual(publisher.url, overrides.url);
			assert.strictEqual(publisher.shouldPush, overrides.shouldPush);
		},

		'default logger'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			publisher.log.writeln('hi');
		}
	},

	hasDeployCredentials: {
		'deployKey false; returns false'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				deployKey: false
			});
			assert.isFalse(publisher.hasDeployCredentials());
		},

		'missing deployKeyTag; returns false'() {
			existsStub.returns(false);
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				deployKey: 'does not exist'
			});
			assert.isFalse(publisher.hasDeployCredentials());
		},

		'missing keyFile; returns false'() {
			existsStub.returns(true);
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				deployKey: 'deploy_key'
			});
			assert.isTrue(publisher.hasDeployCredentials());
		}
	},

	publish: {
		beforeEach() {
			existsStub.onFirstCall().returns(false);
		},

		'skipPublish; commit only'() {
			const log = { writeln: stub() };
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				log,
				skipPublish: true
			});
			const canPublishSpy = spy(publisher, 'canPublish');
			publisher.publish();

			assertCommit();
			assert.isFalse(canPublishSpy.called);
			assert.strictEqual(log.writeln.lastCall.args[0], 'Only committing -- skipping push to repo');
		},

		'shouldPush false; commit only'() {
			const log = { writeln: stub() };
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				log,
				shouldPush() { return false; }
			});
			const canPublishSpy = spy(publisher, 'canPublish');
			publisher.publish();

			assertCommit();
			assert.isFalse(canPublishSpy.called);
			assert.strictEqual(log.writeln.lastCall.args[0], 'Only committing -- skipping push to repo');
		},

		'canPublish false; logs error'() {
			const log = { writeln: stub() };
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				log,
				shouldPush() { return true; }
			});
			const canPublish = stub(publisher, 'canPublish');
			canPublish.returns(false);
			publisher.publish();

			assertCommit();
			assert.strictEqual(log.writeln.lastCall.args[0], 'Push check failed -- not publishing API docs');
		},

		'working case'() {
			existsStub.returns(true);
			const log = { writeln: stub() };
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				log,
				shouldPush() { return true; },
				deployKey: 'deploy_key'
			});
			publisher.publish();

			assertCommit();
			assert.strictEqual(log.writeln.lastCall.args[0], 'Pushed gh-pages to origin');
		}
	},

	shouldPush: {
		setup() {
			process.env.TRAVIS_BRANCH = '';
		},

		teardown() {
			process.env.TRAVIS_BRANCH = cachedTravisBranchEnv;
		},

		'not master; returns false'() {
			execStub.returns('branch');
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isFalse(publisher.shouldPush());
		},

		'branch is master; returns true'() {
			execStub.returns('master');
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isTrue(publisher.shouldPush());
		},

		'travis env is master; returns true'() {
			process.env.TRAVIS_BRANCH = 'master';
			execStub.returns('branch');
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isTrue(publisher.shouldPush());
		}
	}
});
