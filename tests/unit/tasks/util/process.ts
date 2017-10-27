const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { stub } from 'sinon';
import { unloadTasks, loadModule } from '../../util';

let process: any;
const execStub = stub();
const spawnStub = stub();

function assertDefaultOptions(options: any) {
	assert.strictEqual(options.encoding, 'utf8');
	assert.strictEqual(options.stdio, 'inherit');
}
registerSuite('tasks/util/process', {

	before() {
		const mocks = {
			'child_process': {
				'execSync': execStub,
				'spawnSync': spawnStub
			}
		};

		process = loadModule('../../../../tasks/util/process', require, mocks, false);
	},

	beforeEach() {
		execStub.reset();
		spawnStub.reset();
		spawnStub.returns({ stdout: '' });
	},

	after() {
		unloadTasks();
	},

	tests: {
		exec() {
			const command = 'ls -al';
			process.exec(command);
			assert.strictEqual(execStub.lastCall.args[0], command);
			const options = execStub.lastCall.args[1];
			assertDefaultOptions(options);
		},

		spawn() {
			const command = 'ls';
			const args = [ '-al' ];
			process.spawn(command, args);
			assert.isTrue(spawnStub.calledOnce);
			assert.strictEqual(spawnStub.lastCall.args[0], command);
			assert.deepEqual(spawnStub.lastCall.args[1], args);
			const options = spawnStub.lastCall.args[2];
			assertDefaultOptions(options);
		},

		options: {
			'default'() {
				const command = 'cmd';
				process.exec(command);
				assert.strictEqual(execStub.lastCall.args[0], command);
				const options = execStub.lastCall.args[1];
				assertDefaultOptions(options);
			},

			'set encoding'() {
				const command = 'cmd';
				process.exec(command, {
					encoding: 'pizza'
				});
				assert.strictEqual(execStub.lastCall.args[0], command);
				const options = execStub.lastCall.args[1];
				assert.strictEqual(options.encoding, 'pizza');
				assert.strictEqual(options.stdio, 'inherit');
			},

			'silent true'() {
				const command = 'cmd';
				process.exec(command, {
					silent: true
				});
				assert.strictEqual(execStub.lastCall.args[0], command);
				const options = execStub.lastCall.args[1];
				assert.strictEqual(options.encoding, 'utf8');
				assert.strictEqual(options.stdio, 'pipe');
			},

			'stdio set'() {
				const command = 'cmd';
				process.exec(command, {
					stdio: 'pizza'
				});
				assert.strictEqual(execStub.lastCall.args[0], command);
				const options = execStub.lastCall.args[1];
				assert.strictEqual(options.encoding, 'utf8');
				assert.strictEqual(options.stdio, 'pizza');
			}
		}
	}
});
