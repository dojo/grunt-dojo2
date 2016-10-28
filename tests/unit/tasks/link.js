define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'intern/dojo/node!fs',
	'intern/dojo/node!path',
	'intern/dojo/node!process',
	'../util'
], function(registerSuite, assert, grunt, fs, path, process, util) {
	const outputPath = util.getOutputDirectory();
	const cwd = process.cwd();

	let symlinks = [];
	let commands = [];
	let oldSymlink = null;
	let gruntTasks = [];

	registerSuite({
		name: 'tasks/link',
		setup() {
			grunt.initConfig({
				distDirectory: outputPath
			});

			oldSymlink = fs.symlink;
			fs.symlink = function(source, dest, type, callback) {
				symlinks.push({
					source,
					dest,
					type,
					callback
				});
			};

			util.loadTasks({
				fs: fs,
				execa: {
					shell: function(command, options) {
						commands.push({
							command,
							options
						});

						return Promise.resolve({
							stdout: ''
						});
					}
				}
			});
		},
		teardown() {
			util.unloadTasks();
			fs.symlink = oldSymlink;
		},

		beforeEach() {
			symlinks = [];
			commands = [];
		},

		_link() {
			util.runGruntTask('_link');

			assert.lengthOf(symlinks, 2);

			// these are hard to compare...
			delete symlinks[0].callback;
			delete symlinks[1].callback;

			assert.deepEqual(symlinks, [
				{source: path.join(cwd, 'node_modules'), dest: path.join(outputPath, 'node_modules'), type: 'junction'},
				{source: path.join(cwd, 'package.json'), dest: path.join(outputPath, 'package.json'), type: 'file'}
			]);

			assert.deepEqual(commands, [
				{
					command: 'npm link',
					options: {
						cwd: outputPath
					}
				}
			]);
		},

		link: {
			beforeEach() {
				grunt.task.run = function(tasks) {
					gruntTasks = tasks;
				};
			},
			afterEach() {
				gruntTasks = [];
			},

			withDir() {
				util.prepareOutputDirectory();

				util.runGruntTask('link');

				util.cleanOutputDirectory();

				assert.deepEqual(gruntTasks, ['_link']);
			},

			withoutDir() {
				util.cleanOutputDirectory();

				util.runGruntTask('link');

				assert.deepEqual(gruntTasks, ['dist', '_link']);
			}
		}
	});
});
