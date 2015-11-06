define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt'
], function (registerSuite, assert, grunt) {

	/* creating a mock for logging */
	var logStack = [];
	var log = function log() {
		logStack.push(arguments);
	};
	log.logStack = logStack;

	function runGruntTask(taskName, callback) {
		var task = grunt.task._taskPlusArgs(taskName);
		task.task.fn.apply({
			nameArgs: task.nameArgs,
			name: task.task.name,
			args: task.args,
			flags: task.flags,
			async: function() { return callback; }
		}, task.args);
	}

	registerSuite({
		name: 'tasks/updateTsconfig',
		setup: function () {
			grunt.initConfig({
				tsconfigContent: {}
			});
			grunt.loadTasks('tasks');
		},
		basic: function () {
			console.log('stub test');
		}
	});
});
