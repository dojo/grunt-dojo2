define([
	'intern/dojo/node!fs',
	'intern/dojo/node!grunt',
	'intern/dojo/node!os',
	'intern/dojo/node!path',
	'intern/dojo/node!mockery',
	'intern/dojo/node!lodash'
], function(fs,
            grunt,
            os,
            path,
            mockery,
            _) {
	function createIfDoesntExist(dir) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
	}

	return {
		createDummyFile: function(name, data) {
			grunt.file.write(path.join(this.getInputDirectory(), name), data ? data : '', {
				encoding: 'utf-8'
			});
		},

		createDummyDirectory: function(name) {
			var filePath = path.join(this.getInputDirectory(), name);

			fs.mkdirSync(filePath);
		},

		getInputDirectory: function() {
			return './grunt-dojo2_debug-in';
		},

		getOutputDirectory: function() {
			return './grunt-dojo2_debug-out';
		},

		prepareInputDirectory: function() {
			createIfDoesntExist(this.getInputDirectory());
		},

		prepareOutputDirectory: function() {
			createIfDoesntExist(this.getOutputDirectory());
		},

		cleanInputDirectory: function() {
			grunt.file.delete(this.getInputDirectory());
		},

		cleanOutputDirectory: function() {
			grunt.file.delete(this.getOutputDirectory());
		},

		runGruntTask: function(taskName, callback) {
			var task = grunt.task._taskPlusArgs(taskName);

			return task.task.fn.apply({
				nameArgs: task.nameArgs,
				name: task.task.name,
				args: task.args,
				flags: task.flags,
				async: function() {
					return callback;
				}
			}, task.args);
		},

		fileExistsInOutputDirectory: function(fileName) {
			return fs.existsSync(path.join(this.getOutputDirectory(), fileName));
		},

		fileExistsInInputDirectory: function(fileName) {
			return fs.existsSync(path.join(this.getInputDirectory(), fileName));
		},

		loadTasks: function(mocks, options) {

			mockery.enable({
				warnOnReplace: false,
				warnOnUnregistered: false,
				useCleanCache: true
			});
			mockery.resetCache();

			mockery.registerMock('lodash', _);

			if (mocks) {
				var keys = Object.keys(mocks);

				for (var i = 0; i < keys.length; i++) {
					mockery.registerMock(keys[i], mocks[keys[i]]);
				}
			}

			grunt.registerTask('clean', function() {
				console.log('Cleaning ' + this.args[0] + '...');
			});

			var packageJson = grunt.file.readJSON('package.json');

			if (options && options.peerDependencies) {
				packageJson.peerDependencies = options.peerDependencies;
			}

			grunt.file.expand('tasks/*.js').forEach(function(fileName) {
				require.nodeRequire('../../' + fileName.substr(0, fileName.length - 3))(grunt, packageJson);
			});

			// suppress grunt logging
			grunt.log._write = function() { };
		},

		unloadTasks: function() {
			if (mockery.isEnabled) {
				mockery.deregisterAll();
				mockery.disable();
			}
		}
	};
});
