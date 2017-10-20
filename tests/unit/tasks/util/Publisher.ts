const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { SinonStub, SinonSpy, stub, spy } from 'sinon';
import { Options, default as PublisherInstance } from '../../../../tasks/util/Publisher';
import { unloadTasks, loadModule } from '../../util';

const cloneDir = '_tests/cloneDir';
const cpStub: SinonStub = stub();
const rmStub: SinonStub = stub();
const chmodStub: SinonStub = stub();
const spawnStub = stub();
const execStub = stub();
const existsStub: SinonStub = stub();
const log = { writeln: stub() };
let Publisher: typeof PublisherInstance;

registerSuite('tasks/util/Publisher', {

	before() {
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
		Publisher = loadModule('../../../../tasks/util/Publisher', require, mocks);
	},

	beforeEach() {
		cpStub.reset();
		execStub.reset();
		spawnStub.reset();
		rmStub.reset();
		chmodStub.reset();
		existsStub.reset();
		log.writeln.reset();

		spawnStub.returns({
			stdout: 'result'
		});
	},

	after() {
		unloadTasks();
	},

	tests: {
		construct: {
			'no overrides'() {
				const publisher = new Publisher(cloneDir);

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
				const publisher = new Publisher(cloneDir);
				publisher.log.writeln('hi');
			}
		},

		hasDeployCredentials: {
			'missing deployKey; returns false'() {
				existsStub.returns(false);
				const publisher = new Publisher(cloneDir);
				assert.isFalse(publisher.hasDeployCredentials());
			},

			'deployKey is present; returns true'() {
				existsStub.returns(true);
				const publisher = new Publisher(cloneDir);
				assert.isTrue(publisher.hasDeployCredentials());
			}
		},

		init: {
			checkout() {
				const publisher = new Publisher(cloneDir, { log });
				publisher.init();

				assert.include(log.writeln.lastCall.args[0], 'Cloning');
				assert.include(execStub.lastCall.args[0], 'git checkout');
			},

			'create new branch'() {
				execStub.onCall(5).throws(new Error());

				const publisher = new Publisher(cloneDir, { log });
				publisher.init();

				assert.include(execStub.lastCall.args[0], 'git rm');
			},

			'init without deploy key'() {
				existsStub.returns(false);

				const publisher = new Publisher(cloneDir, { log });
				publisher.init();

				assert.isTrue(spawnStub.called);
			},

			'git config is present; does not set config values'() {
				execStub.onCall(0).returns('user.name');
				execStub.onCall(1).returns('user.email');

				const publisher = new Publisher(cloneDir, { log });
				publisher.init();

				assert.include(execStub.getCall(0).args[0], 'git config user.name');
				assert.include(execStub.getCall(1).args[0], 'git config user.email');
				assert.include(execStub.lastCall.args[0], 'git checkout');
				assert.strictEqual(execStub.callCount, 3);
			}
		},

		commit: {
			'no changes; skips commit'() {
				const publisher = new Publisher(cloneDir, { log });
				execStub.onFirstCall().returns('');
				publisher.commit();

				assert.isTrue(execStub.calledOnce);
				assert.include(execStub.getCall(0).args[0], 'git status');
			},

			'changed files; exec commit'() {
				const publisher = new Publisher(cloneDir, { log });
				execStub.onFirstCall().returns('changes');
				publisher.commit();

				assert.isTrue(execStub.calledThrice);
				assert.include(execStub.getCall(0).args[0], 'git status');
				assert.include(execStub.getCall(1).args[0], 'git add');
				assert.include(execStub.lastCall.args[0], 'git commit -m');
			}
		},

		publish() {
			existsStub.returns(true);
			const log = { writeln: stub() };
			const publisher = new Publisher(cloneDir, { log });
			publisher.publish();

			assert.strictEqual(log.writeln.lastCall.args[0], 'Pushed gh-pages to origin');
		}
	}
});
