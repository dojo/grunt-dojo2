define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'intern/dojo/node!lodash',
	'../util'
], function(registerSuite, assert, grunt, lodash, util) {

	var outputPath = util.getOutputDirectory();
	var tasksThatRan = [];
	var oldGrunRun = null;
	var oldLoadTasks = null;

	registerSuite({
		name: 'tasks/ts',
		setup() {
			util.loadTasks();

			oldGruntRun = grunt.task.run;
			grunt.task.run = (tasks) => {
				tasksThatRan = tasks;
			};

			oldLoadTasks = grunt.loadNpmTasks;
			grunt.loadNpmTasks = () => {
				// do nothing
			};

			util.prepareOutputDirectory();
		},
		teardown() {
			grunt.task.run = oldGruntRun;
			grunt.loadNpmTasks = oldLoadTasks;

			util.unloadTasks();
			util.cleanOutputDirectory();
		},

		beforeEach() {
			grunt.initConfig({
				distDirectory: outputPath,
				tsconfig: {
					"compilerOptions": {
						"inlineSourceMap": true,
						"inlineSources": true,
						"listFiles": true,
						"module": "commonjs",
						"noImplicitAny": true,
						"pretty": true,
						"target": "es6"
					}
				},
				ts: {
					custom: {
						compilerOptions: {
							target: 'custom'
						}
					}
				}
			});

			tasksThatRan = [];
		},

		afterEach() {
			tasksThatRan = [];

			if (grunt.file.exists('.tsconfigdist.json')) {
				grunt.file.delete('.tsconfigdist.json');
			}

			if (grunt.file.exists('.tsconfigesm.json')) {
				grunt.file.delete('.tsconfigesm.json');
			}

			if (grunt.file.exists('.tsconfigcustom.json')) {
				grunt.file.delete('.tsconfigcustom.json');
			}

			if (grunt.file.exists('.tsconfigmerged.json')) {
				grunt.file.delete('.tsconfigmerged.json');
			}
		},

		default() {

			util.runGruntTask('ts');

			assert.deepEqual(grunt.config('ts.dev'), {
				tsconfig: {
					passThrough: true,
					tsconfig: 'tsconfig.json'
				}
			});

			assert.deepEqual(tasksThatRan, ['ts:dev']);
		},

		dev() {

			util.runGruntTask('ts:dev');

			assert.deepEqual(grunt.config('ts.dev'), {
				tsconfig: {
					passThrough: true,
					tsconfig: 'tsconfig.json'
				}
			});

			assert.deepEqual(tasksThatRan, ['ts:dev']);
		},

		dist() {
			util.runGruntTask('ts:dist');

			assert.deepEqual(grunt.config('ts.dist'), {
				tsconfig: {
					passThrough: true,
					tsconfig: '.tsconfigdist.json'
				}
			});

			assert.deepEqual(tasksThatRan, ['ts:dist', 'clean:distTsconfig']);

			assert.isTrue(grunt.file.exists('.tsconfigdist.json'));
		},

		esm() {
			grunt.initConfig({
				distDirectory: outputPath,
				tsconfig: {
					"compilerOptions": {
						"inlineSourceMap": true,
						"inlineSources": true,
						"listFiles": true,
						"module": "commonjs",
						"noImplicitAny": true,
						"pretty": true,
						"target": "es6"
					}
				}
			});

			util.runGruntTask('ts:esm');

			assert.deepEqual(grunt.config('ts.esm'), {
				tsconfig: {
					passThrough: true,
					tsconfig: '.tsconfigesm.json'
				}
			});

			assert.deepEqual(tasksThatRan, ['ts:esm', 'clean:esmTsconfig']);

			assert.isTrue(grunt.file.exists('.tsconfigesm.json'));
		},

		custom() {
			util.runGruntTask('ts:custom');

			assert.deepEqual(grunt.config('ts.custom'), {
				tsconfig: {
					passThrough: true,
					tsconfig: '.tsconfigcustom.json'
				}
			});

			assert.deepEqual(tasksThatRan, ['ts:custom', 'clean:customTsconfig']);

			assert.isTrue(grunt.file.exists('.tsconfigcustom.json'));

			// check to make sure the properties get merged
			const content = grunt.file.readJSON('.tsconfigcustom.json');
			assert.equal(content.compilerOptions.target, 'custom');
		}
	});
});
