import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import { stub } from 'sinon';
import { loadTasks, unloadTasks, runGruntTask } from '../util';
import Test = require("intern/lib/Test");

const requireStub = stub();

registerSuite({
	name: 'tasks/run',
	setup() {
		grunt.initConfig({});

		loadTasks({
			'../lib/load-dojo-loader': {
				default: () => {
					return {
						require: requireStub
					};
				}
			}
		});
	},
	teardown() {
		unloadTasks();
	},
	beforeEach() {
		requireStub.reset();
	},
	runsDefault(this: Test) {
		var dfd = this.async(1000);

		runGruntTask('run', () => {
		});

		setTimeout(dfd.callback(() => {
			assert.isTrue(requireStub.calledOnce);
			assert.deepEqual(requireStub.firstCall.args[ 0 ], [ 'src/main' ]);
		}), 100);
	},
	runsArgument(this: Test) {
		var dfd = this.async(1000);

		grunt.option('main', 'my-main');

		runGruntTask('run', () => {
		});

		setTimeout(dfd.callback(() => {
			assert.isTrue(requireStub.calledOnce);
			assert.deepEqual(requireStub.firstCall.args[ 0 ], [ 'my-main' ]);
		}), 100);
	},
});
