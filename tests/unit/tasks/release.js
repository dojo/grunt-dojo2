define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!grunt',
	'intern/dojo/node!sinon',
	'intern/dojo/node!path',
	'intern/dojo/node!process',
	'../util'
], function(registerSuite, assert, grunt, sinon, path, process, util) {
	let shell = sinon.stub();
	let originalOptions = {};

	const gitUrl = 'git@github.com:dojo/test';

	function loadTasks(config, options, mocks) {
		originalOptions = {};

		if (options) {
			Object.keys(options).forEach((option) => {
				originalOptions[option] = grunt.option(option);
				grunt.option(option, options[option]);
			});
		}

		mocks = mocks || {};
		mocks.execa = {
			shell: shell
		};

		grunt.initConfig(config || {});

		util.loadTasks(mocks);
	}

	function unloadTasks() {
		Object.keys(originalOptions).forEach((option) => {
			grunt.option(option, originalOptions[option]);
		});

		util.unloadTasks();
	}

	registerSuite({
		name: 'tasks/release',
		'can-publish-check': (function() {
			var failStub;

			return {
				beforeEach() {
					failStub = sinon.stub(grunt.fail, 'fatal').throws();
					shell = sinon.stub();
				},

				afterEach() {
					failStub.restore();
					unloadTasks();
				},

				'logged out of npm'() {
					const dfd = this.async();

					loadTasks();

					shell.withArgs('npm whoami').returns(Promise.reject()).withArgs('npm view . --json').returns(Promise.resolve(JSON.stringify({
						maintainers: [
							"dojotoolkit <kitsonk@dojotoolkit.org>",
							"sitepen <labs@sitepen.com>"
						]
					})));

					util.runGruntTask('can-publish-check', dfd.rejectOnError(() => {
						assert(false, 'Should have failed');
					})).catch(dfd.callback(() => {
						assert.isTrue(failStub.calledOnce, 'grunt.fail.fatal should have been called once');
						assert.isTrue(failStub.calledWith('not logged into npm'), 'grunt.fail.fatal should have been called with the error message');
					}));
				},

				'not a maintainer'() {
					const dfd = this.async();

					loadTasks();

					shell.withArgs('npm whoami').returns(Promise.resolve({stdout: 'test'})).withArgs('npm view . --json').returns(Promise.resolve({
						stdout: JSON.stringify({
							maintainers: [
								"sitepen <labs@sitepen.com>"
							]
						})
					}));

					util.runGruntTask('can-publish-check', dfd.rejectOnError(() => {
						assert(false, 'Should have failed');
					})).catch(dfd.callback((error) => {
						assert.isTrue(failStub.calledOnce, 'grunt.fail.fatal should have been called once');
						assert.isTrue(failStub.calledWith('cannot publish this package with user test'), 'grunt.fail.fatal should have been called with the error message');
					}));
				},

				'dry run run commands anyways'() {
					const dfd = this.async();

					loadTasks(undefined, {
						'dry-run': true
					});

					shell.withArgs('npm whoami').returns(Promise.reject()).withArgs('npm view . --json').returns(Promise.resolve(JSON.stringify({
						maintainers: [
							"dojotoolkit <kitsonk@dojotoolkit.org>",
							"sitepen <labs@sitepen.com>"
						]
					})));

					util.runGruntTask('can-publish-check', dfd.rejectOnError(() => {
						assert(false, 'Should have failed');
					})).catch(dfd.callback(() => {
						assert.isTrue(failStub.calledOnce, 'grunt.fail.fatal should have been called once');
						assert.isTrue(failStub.calledWith('not logged into npm'), 'grunt.fail.fatal should have been called with the error message');
					}));
				},

				'initial run uses default maintainers'() {
					const dfd = this.async();

					loadTasks(undefined, {
						'initial': true
					});

					shell.withArgs('npm whoami').returns(Promise.resolve({stdout: 'sitepen'})).withArgs('npm view . --json').throws();

					util.runGruntTask('can-publish-check', dfd.callback(() => {
						assert.isTrue(shell.calledOnce);
					})).catch(dfd.rejectOnError(() => {
						assert(false, 'Should have succeeded');
					}));
				}
			};
		})(),
		'repo-is-clean-check': (function() {
			let failStub = {};

			return {
				beforeEach() {
					failStub = sinon.stub(grunt.fail, 'fatal').throws();
					shell = sinon.stub();
				},

				afterEach() {
					failStub.restore();
				},

				'changes on working tree'() {
					const dfd = this.async();

					loadTasks();

					// we need to mock the whole thing because
					shell.withArgs('git status --porcelain').returns(Promise.resolve({stdout: 'change'}));

					util.runGruntTask('repo-is-clean-check', dfd.rejectOnError(() => {
						assert(false, 'should have failed');
					})).catch(dfd.callback(() => {
						assert.isTrue(failStub.calledWith('there are changes in the working tree'));
					}));
				},

				'not on default branch'() {
					const dfd = this.async();

					loadTasks();

					// we need to mock the whole thing because
					shell.withArgs('git status --porcelain').returns(Promise.resolve({stdout: ''})).withArgs('git rev-parse --abbrev-ref HEAD').returns(Promise.resolve({stdout: 'test'}));

					util.runGruntTask('repo-is-clean-check', dfd.rejectOnError(() => {
						assert(false, 'should have failed');
					})).catch(dfd.callback(() => {
						assert.isTrue(failStub.calledWith('not on master branch'));
					}));
				},

				'success'() {
					const dfd = this.async();

					loadTasks();

					// we need to mock the whole thing because
					shell.withArgs('git status --porcelain').returns(Promise.resolve({stdout: ''})).withArgs('git rev-parse --abbrev-ref HEAD').returns(Promise.resolve({stdout: 'master'}));

					util.runGruntTask('repo-is-clean-check', dfd.callback(() => {
					})).catch(dfd.rejectOnError(() => {
						assert(false, 'should have succeeded');
					}));
				}
			};
		})(),
		'release-publish': {
			beforeEach() {
				shell = sinon.stub();
			},

			afterEach() {
				unloadTasks();
			},

			'without a tag'() {
				const dfd = this.async();

				loadTasks();

				shell.withArgs('npm publish .').returns(Promise.resolve({stdout: ''}));

				util.runGruntTask('release-publish', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'should have succeeded');
				}));
			},

			'with a tag'() {
				const dfd = this.async();

				loadTasks(undefined, {
					tag: 'test'
				});

				shell.withArgs('npm publish . --tag test').returns(Promise.resolve({stdout: ''}));

				util.runGruntTask('release-publish', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'should have succeeded');
				}));
			},

			'dry run'() {
				const dfd = this.async();

				loadTasks(undefined, {
					'dry-run': true
				});

				shell.withArgs('npm publish .').returns(Promise.resolve({stdout: ''})).withArgs('npm pack ../temp/').returns(Promise.resolve());

				util.runGruntTask('release-publish', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
					assert.isTrue(shell.calledWith('npm pack ../temp/'));
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'should have succeeded');
				}));
			}
		},
		'release-version-pre-release-tag': (function() {
			var failStub;

			return {
				beforeEach() {
					failStub = sinon.stub(grunt.fail, 'fatal').throws();
					shell = sinon.stub();
				},

				afterEach() {
					failStub.restore();
					unloadTasks();
				},

				'initial, no dry run'() {
					const dfd = this.async();

					loadTasks(undefined, {
						initial: true,
						'pre-release-tag': 'test'
					});

					shell.onFirstCall().returns(Promise.resolve({}));

					util.runGruntTask('release-version-pre-release-tag', dfd.callback(() => {
						assert.isTrue(shell.calledOnce);

						let command = shell.getCalls()[0].args[0];

						assert.isTrue(/npm version [\d.]+-test\.1/.test(command));
					})).catch(dfd.rejectOnError(() => {
						assert(false, 'should have succeeded');
					}));
				},

				'initial, dry run'() {
					const dfd = this.async();

					loadTasks(undefined, {
						initial: true,
						'dry-run': true,
						'pre-release-tag': 'test'
					});

					shell.onFirstCall().returns(Promise.resolve({}));

					util.runGruntTask('release-version-pre-release-tag', dfd.callback(() => {
						assert.isTrue(shell.calledOnce);

						let command = shell.getCalls()[0].args[0];

						assert.isTrue(/npm --no-git-tag-version version [\d.]+-test\.1/.test(command));
					})).catch(dfd.rejectOnError(() => {
						assert(false, 'should have succeeded');
					}));
				},
				'regular w/ bad output'() {
					const dfd = this.async();

					loadTasks(undefined, {
						'pre-release-tag': 'test'
					});

					shell.withArgs('npm view . --json').returns(Promise.resolve({stdout: ''}));

					util.runGruntTask('release-version-pre-release-tag', dfd.rejectOnError(() => {
						assert(false, 'should have failed');
					})).catch(dfd.callback(() => {
						assert.isTrue(shell.calledOnce);
					}));
				},
				'regular'() {
					const dfd = this.async();

					loadTasks(undefined, {
						'pre-release-tag': 'test'
					});

					const packageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));
					const fullVersion = packageJson.version;
					const justTheVersion = fullVersion.replace(/^([^\-]+).*$/g, '$1');

					shell.withArgs('npm view . --json').returns(Promise.resolve({
						stdout: JSON.stringify({
							time: {
								created: '1/1/2016',
								modified: '1/2/2016',
								[`${justTheVersion}-alpha.6`]: "2016-05-13T16:24:33.949Z",
								[`${justTheVersion}-test.7`]: "2016-05-16T13:44:12.669Z",
							}
						})
					})).withArgs(`npm version ${justTheVersion}-test.8`).returns(Promise.resolve({}));

					util.runGruntTask('release-version-pre-release-tag', dfd.callback(() => {
						assert.isTrue(shell.calledTwice);
					})).catch(dfd.rejectOnError((error) => {
						assert(false, 'should have succeeded');
					}));
				}
			};
		})(),
		'release-version-specific': {
			beforeEach() {
				shell = sinon.stub();
			},
			afterEach() {
				unloadTasks();
			},
			'dry run'() {
				const dfd = this.async();

				loadTasks(undefined, {
					'dry-run': true,
					'release-version': '2.0.0-test.1'
				});

				shell.withArgs('npm --no-git-tag-version version 2.0.0-test.1').returns(Promise.resolve());

				util.runGruntTask('release-version-specific', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				}));
			},
			'regular'() {
				const dfd = this.async();

				loadTasks(undefined, {
					'release-version': '2.0.0-test.1'
				});

				shell.withArgs('npm version 2.0.0-test.1').returns(Promise.resolve());

				util.runGruntTask('release-version-specific', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				}));
			}
		},
		'post-release-version': {
			beforeEach() {
				shell = sinon.stub();

				// save our actual package.json
				grunt.file.copy('package.json', 'package.json.bak');
			},

			afterEach() {
				unloadTasks();

				// restore our package.json
				grunt.file.copy('package.json.bak', 'package.json');
				grunt.file.delete('package.json.bak');
			},

			'without next version, without push back'() {
				const dfd = this.async();

				const originalPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

				loadTasks();

				shell.withArgs('git commit -am "Update package metadata"').returns(Promise.resolve({}));

				util.runGruntTask('post-release-version', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);

					const newPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

					assert.equal(newPackageJson.version, originalPackageJson.version);
				}));
			},

			'without next version'() {
				const dfd = this.async();

				loadTasks(undefined, {
					'push-back': true
				}, {
					'parse-git-config': {
						sync: function() {
							return {
								'remote "origin"': {
									url: gitUrl
								}
							};
						}
					}
				});

				shell.withArgs(
					'git commit -am "Update package metadata"'
				).returns(
					Promise.resolve({})
				).withArgs(
					`git push ${gitUrl} master`
				).returns(
					Promise.resolve()
				).withArgs(
					`git push ${gitUrl} --tags`
				).returns(
					Promise.resolve()
				);

				util.runGruntTask('post-release-version', dfd.callback(() => {
					assert.isTrue(shell.calledThrice);
				}));
			},

			'no remotes'() {
				const dfd = this.async();

				loadTasks(undefined, {
					'push-back': true
				}, {
					'parse-git-config': {
						sync: function() {
							return {
								'remote "origin"': {
									url: 'test'
								}
							};
						}
					}
				});

				shell.withArgs(
					'git commit -am "Update package metadata"'
				).returns(
					Promise.resolve({})
				);

				util.runGruntTask('post-release-version', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				}));
			},

			'next version'() {
				const dfd = this.async();

				const originalPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

				loadTasks(undefined, {
					'next-version': 'test-version'
				});

				shell.withArgs('git commit -am "Update package metadata"').returns(Promise.resolve({}));

				util.runGruntTask('post-release-version', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);

					const newPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

					assert.equal(newPackageJson.version, 'test-version');
				}));
			}
		},
		'release-publish-flat': (function() {
			var runStub;

			return {
				beforeEach() {
					runStub = sinon.stub(grunt.task, 'run');

					// save our actual package.json
					grunt.file.copy('package.json', 'package.json.bak');
				},

				afterEach() {
					runStub.restore();

					unloadTasks();

					grunt.file.delete('temp');

					// restore our package.json
					grunt.file.copy('package.json.bak', 'package.json');
					grunt.file.delete('package.json.bak');

					if (grunt.file.exists('README.md.bak')) {
						grunt.file.copy('README.md.bak', 'README.md');
						grunt.file.delete('README.md.bak');
					}
				},

				'run'() {
					util.runGruntTask('release-publish-flat');

					assert.isTrue(runStub.calledOnce);
					assert.deepEqual(runStub.getCalls()[0].args[0], ['copy:temp', 'release-publish', 'clean:temp']);

					const newPackageJson = grunt.file.readJSON(path.join('temp', 'package.json'));

					assert.isUndefined(newPackageJson.private);
					assert.isUndefined(newPackageJson.scripts);
					assert.isUndefined(newPackageJson.files);
					assert.isUndefined(newPackageJson.typings);
					assert.equal(newPackageJson.main, 'main.js');

					assert.isTrue(grunt.file.exists('temp/README.md'));
				},

				'run w/o no extras'() {
					grunt.file.copy('README.md', 'README.md.bak');
					grunt.file.delete('README.md');

					util.runGruntTask('release-publish-flat');

					assert.isFalse(grunt.file.exists('temp/README.md'));
				}
			};
		})(),
		release: (function() {
			let failStub;
			let runStub;

			return {
				beforeEach() {
					failStub = sinon.stub(grunt.fail, 'fatal').throws();
					runStub = sinon.stub(grunt.task, 'run');
				},

				afterEach() {
					failStub.restore();
					runStub.restore();

					unloadTasks();
				},

				'skipChecks on non dry run'() {
					let caughtError = null;

					loadTasks(undefined, {
						'dry-run': false,
						'skip-checks': true
					});

					try {
						util.runGruntTask('release');
					} catch (e) {
						caughtError = e;
					} finally {
						assert.isNotNull(caughtError);
						assert.isTrue(failStub.calledOnce);
					}
				},

				'run with no version'() {
					let caughtError = null;

					loadTasks(undefined, {});

					try {
						util.runGruntTask('release');
					} catch (e) {
						caughtError = e;
					} finally {
						assert.isNotNull(caughtError);
						assert.isTrue(failStub.calledOnce);
					}
				},

				'run w/ prerelease tags'() {
					loadTasks(undefined, {
						'pre-release-tag': 'beta'
					});

					util.runGruntTask('release');

					assert.isTrue(runStub.calledOnce);
					assert.deepEqual(runStub.getCalls()[0].args[0], [
						'can-publish-check',
						'repo-is-clean-check',
						'dist',
						'release-version-pre-release-tag',
						'release-publish-flat',
						'post-release-version'
					]);
				},

				'run w/ prerelease tags w/ skipchecks'() {
					loadTasks(undefined, {
						'pre-release-tag': 'beta',
						'skip-checks': true,
						'dry-run': true
					});

					util.runGruntTask('release');

					assert.isTrue(runStub.calledOnce);
					assert.deepEqual(runStub.getCalls()[0].args[0], [
						'dist',
						'release-version-pre-release-tag',
						'release-publish-flat',
						'post-release-version'
					]);
				},

				'run w/ release tag and version'() {
					loadTasks(undefined, {
						'release-version': '1.2.3-alpha',
						'next-version': '1.2.3'
					});

					util.runGruntTask('release');

					assert.isTrue(runStub.calledOnce);
					assert.deepEqual(runStub.getCalls()[0].args[0], [
						'can-publish-check',
						'repo-is-clean-check',
						'dist',
						'release-version-specific',
						'release-publish-flat',
						'post-release-version'
					]);
				}
			};
		})()
	});
});
