const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import { stub } from 'sinon';
import { loadTasks, unloadTasks, runGruntTask } from '../util';

const requireStub = stub();

registerSuite('tasks/run', {
	before() {
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
	after() {
		unloadTasks();
	},
	beforeEach() {
		requireStub.reset();
	},
	tests: {
		runsDefault() {
			const dfd = this.async(1000);

			runGruntTask('run', () => {
			});

			setTimeout(dfd.callback(() => {
				assert.isTrue(requireStub.calledOnce);
				assert.deepEqual(requireStub.firstCall.args[ 0 ], [ 'src/main' ]);
			}), 100);
		},
		runsArgument() {
			const dfd = this.async(1000);

			grunt.option('main', 'my-main');

			runGruntTask('run', () => {
			});

			setTimeout(dfd.callback(() => {
				assert.isTrue(requireStub.calledOnce);
				assert.deepEqual(requireStub.firstCall.args[ 0 ], [ 'my-main' ]);
			}), 100);
		}
	}
});
