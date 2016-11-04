import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import { loadTasks, unloadTasks, runGruntTask } from '../util';

let fakeRepl: any = {};
const fakeDojoRequire = function () {
};

registerSuite({
	name: 'tasks/repl',
	setup() {
		grunt.initConfig({});

		loadTasks({
			repl: {
				start() {
					return {
						context: fakeRepl
					};
				}
			},
			'../lib/load-dojo-loader': {
				default() {
					return {
						baseUrl: './base-url',
						packages: [
							{
								name: 'package-1'
							}
						],
						require: fakeDojoRequire
					};
				}
			},

			'resolve-from'(fromDir: string, moduleId: string) {
				return fromDir + '/' + moduleId;
			},

			'./base-url/test-package': {
				hello: 'world'
			}
		});
	},
	teardown() {
		unloadTasks();
	},

	repl() {
		const dfd = this.async();

		runGruntTask('repl');

		setTimeout(dfd.callback(() => {
			assert.isNotNull(fakeRepl.require);
			assert.isNotNull(fakeRepl.nodeRequire);

			assert.equal(fakeRepl.require, fakeDojoRequire);
			assert.notEqual(fakeRepl.nodeRequire, fakeDojoRequire);

			let testPackage = fakeRepl.nodeRequire('test-package');
			assert.deepEqual(testPackage, { hello: 'world' });
			assert.equal(fakeRepl.nodeRequire.resolve('test-package'), './base-url/test-package');
		}), 10);
	}
});

