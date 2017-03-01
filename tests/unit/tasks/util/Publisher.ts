import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { SinonStub, stub, spy } from 'sinon';
import { Options, default as PublisherInstance } from 'grunt-dojo2/tasks/util/Publisher';
import { unloadTasks, loadModule } from 'grunt-dojo2/tests/unit/util';

const cloneDir = '_tests/cloneDir';
const generatedDocsDir = '_tests/generatedDocsDir';
const cpStub: SinonStub = stub();
const rmStub: SinonStub = stub();
const execStub: SinonStub = stub();
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
	},

	teardown() {
		unloadTasks();
	},

	construct: {
		'no overrides'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir);

			assert.strictEqual(publisher.cloneDir, cloneDir);
			assert.strictEqual(publisher.encryptedDeployKey, false);
			assert.isUndefined(publisher.deployKeyTag);
			assert.strictEqual(publisher.generatedDocsDirectory, generatedDocsDir);
			assert.strictEqual(publisher.subDirectory, 'api');
			assert.strictEqual(publisher.branch, 'gh-pages');
			assert.strictEqual(publisher.shouldPush, Publisher.prototype.shouldPush);
			assert.isFalse(publisher.skipPublish);
		},

		'with overrides'() {
			const overrides: Options = {
				branch: 'branch',
				deployKeyTag: 'deployKeyTag',
				encryptedDeployKey: 'encrypted',
				shouldPush: () => false,
				subDirectory: 'subDirectory'
			};
			const publisher = new Publisher(cloneDir, generatedDocsDir, overrides);

			assert.strictEqual(publisher.cloneDir, cloneDir);
			assert.strictEqual(publisher.encryptedDeployKey, overrides.encryptedDeployKey);
			assert.strictEqual(publisher.deployKeyTag, overrides.deployKeyTag);
			assert.strictEqual(publisher.generatedDocsDirectory, generatedDocsDir);
			assert.strictEqual(publisher.subDirectory, overrides.subDirectory);
			assert.strictEqual(publisher.branch, overrides.branch);
			assert.strictEqual(publisher.shouldPush, overrides.shouldPush);
			assert.isFalse(publisher.skipPublish);
		}
	},

	hasDeployCredentials: {
		'missing encryptedDeployKey; returns false'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				deployKeyTag: 'key tag'
			});
			assert.isFalse(publisher.hasDeployCredentials());
		},

		'missing deployKeyTag; returns false'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				encryptedDeployKey: 'LICENSE'
			});
			assert.isFalse(publisher.hasDeployCredentials());
		},

		'missing keyFile; returns false'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				deployKeyTag: 'key tag',
				encryptedDeployKey: 'does-not-exist'
			});
			assert.isFalse(publisher.hasDeployCredentials());
		},

		'keyFile present; returns true'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				deployKeyTag: 'key tag',
				encryptedDeployKey: 'LICENSE'
			});
			assert.isTrue(publisher.hasDeployCredentials());
		}
	},

	publish: {
		'skipPublish; commit only'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			const log = publisher.log = { writeln: stub() };
			const decryptDeployKey = spy(publisher, 'decryptDeployKey');
			publisher.skipPublish = true;
			publisher.publish();

			assertCommit();
			assert.isFalse(decryptDeployKey.called);
			assert.strictEqual(log.writeln.lastCall.args[0], 'Only committing -- skipping push to repo');
		},

		'shouldPush false; commit only'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				shouldPush() { return false; }
			});
			const log = publisher.log = { writeln: stub() };
			const decryptDeployKey = spy(publisher, 'decryptDeployKey');
			publisher.publish();

			assertCommit();
			assert.isFalse(decryptDeployKey.called);
			assert.strictEqual(log.writeln.lastCall.args[0], 'Only committing -- skipping push to repo');
		},

		'canPublish false; logs error'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				shouldPush() { return true; }
			});
			const decryptDeployKey = spy(publisher, 'decryptDeployKey');
			const canPublish = stub(publisher, 'canPublish');
			const log = publisher.log = { writeln: stub() };
			canPublish.returns(false);
			publisher.publish();

			assertCommit();
			assert.isTrue(decryptDeployKey.called);
			assert.strictEqual(log.writeln.lastCall.args[0], 'Push check failed -- not publishing API docs');
		},

		'working case'() {
			const publisher = new Publisher(cloneDir, generatedDocsDir, {
				shouldPush() { return true; }
			});
			const decryptDeployKey = spy(publisher, 'decryptDeployKey');
			const canPublish = stub(publisher, 'canPublish');
			const log = publisher.log = { writeln: stub() };
			canPublish.returns(true);
			publisher.publish();

			assertCommit();
			assert.isTrue(decryptDeployKey.called);
			assert.strictEqual(log.writeln.lastCall.args[0], 'Pushed gh-pages to origin');
		}
	},

	shouldPush: {
		'not master; returns false'() {
			execStub.returns('branch');
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isFalse(publisher.shouldPush());
		},

		'branch is master; returns true'() {
			execStub.returns('master');
			const publisher = new Publisher(cloneDir, generatedDocsDir);
			assert.isTrue(publisher.shouldPush());
		}
	}
});
