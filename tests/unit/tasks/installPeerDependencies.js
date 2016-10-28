define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'../util'
], function(registerSuite, assert, grunt, util) {

	let commands = [];
	let errors = [];

	let oldErrorLogger = null;

	registerSuite({
		name: 'tasks/installPeerDependencies',
		setup() {
			grunt.initConfig({});

			oldErrorLogger = grunt.log.error;
			grunt.log.error = function(msg) {
				errors.push(msg);
			};

			util.loadTasks({
				child_process: {
					execSync: function(command) {
						commands.push(command);

						if (command.indexOf('error-dep') !== -1) {
							throw 'error';
						}
					}
				}
			}, {
				peerDependencies: {
					'my-dep': '1.0',
					'error-dep': '1.0'
				}
			});
		},
		teardown() {
			grunt.log.error = oldErrorLogger;
			util.unloadTasks();
		},

		beforeEach() {
			commands = [];
			errors = [];
		},

		runsCommands() {
			util.runGruntTask('peerDepInstall');

			assert.deepEqual(commands, ['npm install my-dep@"1.0"', 'npm install error-dep@"1.0"']);
			assert.deepEqual(errors, ['failed.']);
		}
	});
});
