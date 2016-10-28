define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'../util'
], function(registerSuite, assert, grunt, util) {
	let fakeRepl = {};
	let fakeDojoRequire = function() {
	};

	registerSuite({
		name: 'tasks/repl',
		setup() {
			grunt.initConfig({});

			util.loadTasks({
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

				'resolve-from'(fromDir, moduleId) {
					return fromDir + '/' + moduleId;
				},

				'./base-url/test-package': {
					hello: 'world'
				}
			});
		},
		teardown() {
			util.unloadTasks();
		},

		repl() {
			const dfd = this.async();

			util.runGruntTask('repl');

			setTimeout(dfd.callback(() => {
				assert.isNotNull(fakeRepl.require);
				assert.isNotNull(fakeRepl.nodeRequire);

				assert.equal(fakeRepl.require, fakeDojoRequire);
				assert.notEqual(fakeRepl.nodeRequire, fakeDojoRequire);

				let testPackage = fakeRepl.nodeRequire('test-package');
				assert.deepEqual(testPackage, {hello: 'world'});
				assert.equal(fakeRepl.nodeRequire.resolve('test-package'), './base-url/test-package');
			}), 10);
		}
	});
});
