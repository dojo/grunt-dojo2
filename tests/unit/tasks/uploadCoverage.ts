const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import { loadTasks, unloadTasks, runGruntTask } from '../util';
import { SinonStub, stub } from 'sinon';

let execStub: SinonStub;

registerSuite('tasks/uploadCoverage', {
	before() {
		execStub = stub();
		grunt.initConfig({});

		loadTasks({
			'./util/process': {
				exec: execStub
			}
		});
	},
	beforeEach() {
		execStub.reset();
	},
	after() {
		unloadTasks();
	},
	tests: {
		default() {
			runGruntTask('uploadCoverage');
			assert.isTrue(execStub.calledOnce);
			const codecov = require.resolve('codecov/bin/codecov');
			assert.isTrue(execStub.calledWithExactly(`node "${codecov}" --file=coverage/coverage.json`));
		}
	}
});
