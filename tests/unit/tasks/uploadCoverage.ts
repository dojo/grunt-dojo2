const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import { loadTasks, unloadTasks, runGruntTask } from '../util';
import { SinonStub, stub } from 'sinon';

const coverageFileName = 'coverage-final.lcov';

let sendCodeCov: SinonStub = stub().callsArgWith(1, 'error');
let read: SinonStub;

registerSuite('tasks/uploadCoverage', {
	before() {
		grunt.initConfig({});

		loadTasks({
			'codecov.io/lib/sendToCodeCov.io': sendCodeCov
		});

		read = stub(grunt.file, 'read').withArgs(
			coverageFileName
		).returns(
			JSON.stringify({
				hello: 'world'
			})
		);
	},
	after() {
		unloadTasks();
	},
	tests: {
		propagatesReturnValue() {
			const dfd = this.async();

			runGruntTask('uploadCoverage', dfd.callback(() => {
				assert.isTrue(sendCodeCov.calledOnce);
				assert.deepEqual(JSON.parse(sendCodeCov.firstCall.args[ 0 ]), { hello: 'world' });
			}));
		}
	}
});
