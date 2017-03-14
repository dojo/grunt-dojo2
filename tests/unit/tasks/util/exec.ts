import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import { stub } from 'sinon';
import { unloadTasks, loadModule } from 'grunt-dojo2/tests/unit/util';

let exec: any;
const execStub = stub();

registerSuite({
	name: 'tasks/util/exec',

	setup() {
		const mocks = {
			'child_process': {
				'execSync': execStub
			}
		};

		exec = loadModule('grunt-dojo2/tasks/util/exec', mocks);
	},

	teardown() {
		unloadTasks();
	},

	'default'() {
		const command = 'cmd';
		exec(command);
		assert.strictEqual(execStub.lastCall.args[0], command);
		const options = execStub.lastCall.args[1];
		assert.strictEqual(options.encoding, 'utf8');
		assert.strictEqual(options.stdio, 'inherit');
	},

	'set encoding'() {
		const command = 'cmd';
		exec(command, {
			encoding: 'pizza'
		});
		assert.strictEqual(execStub.lastCall.args[0], command);
		const options = execStub.lastCall.args[1];
		assert.strictEqual(options.encoding, 'pizza');
		assert.strictEqual(options.stdio, 'inherit');
	},

	'silent true'() {
		const command = 'cmd';
		exec(command, {
			silent: true
		});
		assert.strictEqual(execStub.lastCall.args[0], command);
		const options = execStub.lastCall.args[1];
		assert.strictEqual(options.encoding, 'utf8');
		assert.strictEqual(options.stdio, 'pipe');
	},

	'stdio set'() {
		const command = 'cmd';
		exec(command, {
			stdio: 'pizza'
		});
		assert.strictEqual(execStub.lastCall.args[0], command);
		const options = execStub.lastCall.args[1];
		assert.strictEqual(options.encoding, 'utf8');
		assert.strictEqual(options.stdio, 'pizza');
	}
});
