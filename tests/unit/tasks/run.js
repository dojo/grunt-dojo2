define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'../util'
], function(registerSuite, assert, grunt, util) {
	var requirePath = [];

	function loadDojoLoader() {
		return {
			require: function(path) {
				requirePath = path;
			}
		};
	}

	registerSuite({
		name: 'tasks/run',
		setup() {
			grunt.initConfig({});

			util.loadTasks({
				'../lib/load-dojo-loader': {default: loadDojoLoader}
			});
		},
		teardown() {
			util.unloadTasks();
		},
		runsDefault() {
			var dfd = this.async(1000);

			util.runGruntTask('run', () => {
			});

			setTimeout(dfd.callback(() => {
				assert.deepEqual(requirePath, ['src/main']);
			}), 100);
		},
		runsArgument() {
			var dfd = this.async(1000);

			grunt.option('main', 'my-main');

			util.runGruntTask('run', () => {
			});

			setTimeout(dfd.callback(() => {
				assert.deepEqual(requirePath, ['my-main']);
			}), 100);
		},
	});
});
