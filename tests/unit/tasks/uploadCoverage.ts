import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import { loadTasks, unloadTasks, runGruntTask } from '../util';
import { SinonStub, stub } from 'sinon';
import Test = require("intern/lib/Test");

const coverageFileName = 'coverage-final.lcov';

let sendCodeCov: SinonStub = stub().callsArgWith(1, 'error');
let read: SinonStub;

registerSuite({
	name: 'tasks/uploadCoverage',
	setup() {
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
	teardown() {
		unloadTasks();
	},
	propagatesReturnValue(this: Test) {
		var dfd = this.async();

		runGruntTask('uploadCoverage', dfd.callback(() => {
			assert.isTrue(sendCodeCov.calledOnce);
			assert.deepEqual(JSON.parse(sendCodeCov.firstCall.args[ 0 ]), { hello: 'world' });
		}));
	}
});
