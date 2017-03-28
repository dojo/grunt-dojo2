import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import { stub, SinonStub } from 'sinon';
import * as path from 'path';
import { unloadTasks, loadTasks, runGruntTask } from '../util';
import Test = require('intern/lib/Test');

let shell: SinonStub = stub();
let originalOptions: {
	[key: string]: any;
} = {};

const gitUrl = 'git@github.com:dojo/test';

function taskLoader(config?: { [key: string]: any }, options?: { [key: string]: any }, mocks: { [key: string]: any } = {}) {
	originalOptions = {};

	if (options) {
		Object.keys(options).forEach((option) => {
			originalOptions[ option ] = grunt.option(option);
			grunt.option(option, options[ option ]);
		});
	}

	mocks[ 'execa' ] = {
		shell: shell
	};

	grunt.initConfig(config || {});

	loadTasks(mocks);
}

function taskUnloader() {
	Object.keys(originalOptions).forEach((option: string) => {
		grunt.option(option, originalOptions[ option ]);
	});

	unloadTasks();
}

registerSuite({
	name: 'tasks/release',
	'can-publish-check': (function () {
		let fail: SinonStub;

		return {
			beforeEach() {
				fail = stub(grunt.fail, 'fatal').throws();
				shell = stub();
			},

			afterEach() {
				fail.restore();
				taskUnloader();
			},

			'logged out of npm'(this: Test) {
				const dfd = this.async();

				taskLoader();

				shell.withArgs('npm whoami')
					.returns(Promise.reject(new Error()))
					.withArgs('npm view . --json')
					.returns(Promise.resolve(JSON.stringify({
						maintainers: [
							'dojotoolkit <kitsonk@dojotoolkit.org>',
							'sitepen <labs@sitepen.com>'
						]
					})));

				runGruntTask('can-publish-check', dfd.rejectOnError(() => {
					assert(false, 'Should have failed');
				})).catch(dfd.callback(() => {
					assert.isTrue(fail.calledOnce, 'grunt.fail.fatal should have been called once');
					assert.isTrue(fail.calledWith('not logged into npm'), 'grunt.fail.fatal should have been called with the error message');
				}));
			},

			'not a maintainer'(this: Test) {
				const dfd = this.async();

				taskLoader();

				shell.withArgs('npm whoami').returns(Promise.resolve({ stdout: 'test' })).withArgs('npm view . --json').returns(Promise.resolve({
					stdout: JSON.stringify({
						maintainers: [
							"sitepen <labs@sitepen.com>"
						]
					})
				}));

				runGruntTask('can-publish-check', dfd.rejectOnError(() => {
					assert(false, 'Should have failed');
				})).catch(dfd.callback((error: Error) => {
					assert.isTrue(fail.calledOnce, 'grunt.fail.fatal should have been called once');
					assert.isTrue(fail.calledWith('cannot publish this package with user test'), 'grunt.fail.fatal should have been called with the error message');
				}));
			},

			'dry run run commands anyways'(this: Test) {
				const dfd = this.async();

				taskLoader(undefined, {
					'dry-run': true
				});

				shell.withArgs('npm whoami')
					.returns(Promise.reject(new Error()))
					.withArgs('npm view . --json')
					.returns(Promise.resolve(JSON.stringify({
						maintainers: [
							"dojotoolkit <kitsonk@dojotoolkit.org>",
							"sitepen <labs@sitepen.com>"
						]
					})));

				runGruntTask('can-publish-check', dfd.rejectOnError(() => {
					assert(false, 'Should have failed');
				})).catch(dfd.callback(() => {
					assert.isTrue(fail.calledOnce, 'grunt.fail.fatal should have been called once');
					assert.isTrue(fail.calledWith('not logged into npm'), 'grunt.fail.fatal should have been called with the error message');
				}));
			},

			'initial run uses default maintainers'(this: Test) {
				const dfd = this.async();

				taskLoader(undefined, {
					'initial': true
				});

				shell.withArgs('npm whoami')
					.returns(Promise.resolve({ stdout: 'dojo' }))
					.withArgs('npm view . --json')
					.throws();

				runGruntTask('can-publish-check', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'Should have succeeded');
				}));
			}
		};
	})(),
	'repo-is-clean-check': (function () {
		let failStub: SinonStub;

		return {
			beforeEach() {
				failStub = stub(grunt.fail, 'fatal').throws();
				shell = stub();
			},

			afterEach() {
				failStub.restore();
			},

			'changes on working tree'(this: Test) {
				const dfd = this.async();

				taskLoader();

				// we need to mock the whole thing because
				shell.withArgs('git status --porcelain')
					.returns(Promise.resolve({ stdout: 'change' }));

				runGruntTask('repo-is-clean-check', dfd.rejectOnError(() => {
					assert(false, 'should have failed');
				})).catch(dfd.callback(() => {
					assert.isTrue(failStub.calledWith('there are changes in the working tree'));
				}));
			},

			'not on default branch'(this: Test) {
				const dfd = this.async();

				taskLoader();

				// we need to mock the whole thing because
				shell.withArgs('git status --porcelain')
					.returns(Promise.resolve({ stdout: '' }))
					.withArgs('git rev-parse --abbrev-ref HEAD')
					.returns(Promise.resolve({ stdout: 'test' }));

				runGruntTask('repo-is-clean-check', dfd.rejectOnError(() => {
					assert(false, 'should have failed');
				})).catch(dfd.callback(() => {
					assert.isTrue(failStub.calledWith('not on master branch'));
				}));
			},

			'success'(this: Test) {
				const dfd = this.async();

				taskLoader();

				// we need to mock the whole thing because
				shell.withArgs('git status --porcelain')
					.returns(Promise.resolve({ stdout: '' }))
					.withArgs('git rev-parse --abbrev-ref HEAD')
					.returns(Promise.resolve({ stdout: 'master' }));

				runGruntTask('repo-is-clean-check', dfd.callback(() => {
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'should have succeeded');
				}));
			}
		};
	})(),
	'release-publish': {
		beforeEach() {
			shell = stub();
		},

		afterEach() {
			taskUnloader();
		},

		'without a tag'(this: Test) {
			const dfd = this.async();

			taskLoader();

			shell.withArgs('npm publish .')
				.returns(Promise.resolve({ stdout: '' }));

			runGruntTask('release-publish', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);
				assert.isTrue(shell.calledWith('npm publish .'));
			})).catch(dfd.rejectOnError(() => {
				assert(false, 'should have succeeded');
			}));
		},

		'with a tag'(this: Test) {
			const dfd = this.async();

			taskLoader(undefined, {
				tag: 'test'
			});

			shell.withArgs('npm publish . --tag test')
				.returns(Promise.resolve({ stdout: '' }));

			runGruntTask('release-publish', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);
				assert.isTrue(shell.calledWith('npm publish . --tag test'));
			})).catch(dfd.rejectOnError(() => {
				assert(false, 'should have succeeded');
			}));
		},

		'dry run'(this: Test) {
			const dfd = this.async();

			taskLoader(undefined, {
				'dry-run': true
			});

			shell.withArgs('npm publish .')
				.returns(Promise.resolve({ stdout: '' }))
				.withArgs('npm pack ../temp/')
				.returns(Promise.resolve());

			runGruntTask('release-publish', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);
				assert.isTrue(shell.calledWith('npm pack ../temp/'));
			})).catch(dfd.rejectOnError(() => {
				assert(false, 'should have succeeded');
			}));
		}
	},
	'release-version-pre-release-tag': (function () {
		let failStub: SinonStub;

		return {
			beforeEach() {
				failStub = stub(grunt.fail, 'fatal').throws();
				shell = stub();
			},

			afterEach() {
				failStub.restore();
				taskUnloader();
			},

			'initial, no dry run'(this: Test) {
				const dfd = this.async();

				taskLoader(undefined, {
					initial: true,
					'pre-release-tag': 'test'
				});

				shell.onFirstCall()
					.returns(Promise.resolve({}));

				runGruntTask('release-version-pre-release-tag', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);

					let command = (<any> shell).getCalls()[ 0 ].args[ 0 ];

					assert.isTrue(/npm version [\d.]+-test\.1/.test(command));
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'should have succeeded');
				}));
			},

			'initial, dry run'(this: Test) {
				const dfd = this.async();

				taskLoader(undefined, {
					initial: true,
					'dry-run': true,
					'pre-release-tag': 'test'
				});

				shell.onFirstCall()
					.returns(Promise.resolve({}));

				runGruntTask('release-version-pre-release-tag', dfd.callback(() => {
					assert.isTrue(shell.calledOnce);

					let command = (<any> shell).getCalls()[ 0 ].args[ 0 ];

					assert.isTrue(/npm --no-git-tag-version version [\d.]+-test\.1/.test(command));
				})).catch(dfd.rejectOnError(() => {
					assert(false, 'should have succeeded');
				}));
			},
			'regular w/ bad output'(this: Test) {
				const dfd = this.async();

				taskLoader(undefined, {
					'pre-release-tag': 'test'
				});

				shell.withArgs('npm view . --json')
					.returns(Promise.resolve({ stdout: '' }));

				runGruntTask('release-version-pre-release-tag', dfd.rejectOnError(() => {
					assert(false, 'should have failed');
				})).catch(dfd.callback(() => {
					assert.isTrue(shell.calledOnce);
				}));
			},
			'regular'(this: Test) {
				const dfd = this.async();

				taskLoader(undefined, {
					'pre-release-tag': 'test'
				});

				const packageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));
				const fullVersion = packageJson.version;
				const justTheVersion = fullVersion.replace(/^([^\-]+).*$/g, '$1');

				shell.onCall(0)
					.returns(Promise.resolve({
						stdout: JSON.stringify({
							time: {
								created: '1/1/2016',
								modified: '1/2/2016',
								[`${justTheVersion}-alpha.6`]: "2016-05-13T16:24:33.949Z",
								[`${justTheVersion}-test.7`]: "2016-05-16T13:44:12.669Z",
							}
						})
					}))
					.onCall(1)
					.returns(Promise.resolve({}));

				runGruntTask('release-version-pre-release-tag', dfd.callback(() => {
					assert.isTrue(shell.calledTwice);
					assert.equal(shell.firstCall.args[ 0 ], 'npm view . --json');
					assert.equal(shell.secondCall.args[ 0 ], `npm version ${justTheVersion}-test.8`);
				})).catch(dfd.rejectOnError((error: any) => {
					console.log('*** ERRROR *', error);
					assert(false, 'should have succeeded');
				}));
			}
		};
	})(),
	'release-version-specific': {
		beforeEach() {
			shell = stub();
		},
		afterEach() {
			taskUnloader();
		},
		'dry run'(this: Test) {
			const dfd = this.async();

			taskLoader(undefined, {
				'dry-run': true,
				'release-version': '2.0.0-test.1'
			});

			shell.withArgs('npm --no-git-tag-version version 2.0.0-test.1')
				.returns(Promise.resolve());

			runGruntTask('release-version-specific', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);
			}));
		},
		'regular'(this: Test) {
			const dfd = this.async();

			taskLoader(undefined, {
				'release-version': '2.0.0-test.1'
			});

			shell.withArgs('npm version 2.0.0-test.1')
				.returns(Promise.resolve());

			runGruntTask('release-version-specific', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);
			}));
		}
	},
	'post-release-version': {
		beforeEach() {
			shell = stub();

			// save our actual package.json
			grunt.file.copy('package.json', 'package.json.bak');
		},

		afterEach() {
			taskUnloader();

			// restore our package.json
			grunt.file.copy('package.json.bak', 'package.json');
			grunt.file.delete('package.json.bak');
		},

		'without next version, without push back'(this: Test) {
			const dfd = this.async();

			const originalPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

			taskLoader();

			shell.withArgs('git commit -am "Update package metadata"')
				.returns(Promise.resolve({}));

			runGruntTask('post-release-version', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);

				const newPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

				assert.equal(newPackageJson.version, originalPackageJson.version);
			}));
		},

		'without next version'(this: Test) {
			const dfd = this.async();

			taskLoader(undefined, {
				'push-back': true
			}, {
				'parse-git-config': {
					sync: function () {
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

			runGruntTask('post-release-version', dfd.callback(() => {
				assert.isTrue(shell.calledThrice);
			}));
		},

		'no remotes'(this: Test) {
			const dfd = this.async();

			taskLoader(undefined, {
				'push-back': true
			}, {
				'parse-git-config': {
					sync: function () {
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

			runGruntTask('post-release-version', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);
			}));
		},

		'next version'(this: Test) {
			const dfd = this.async();

			const originalPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

			taskLoader(undefined, {
				'next-version': 'test-version'
			});

			shell.withArgs('git commit -am "Update package metadata"')
				.returns(Promise.resolve({}));

			runGruntTask('post-release-version', dfd.callback(() => {
				assert.isTrue(shell.calledOnce);

				const newPackageJson = grunt.file.readJSON(path.join(process.cwd(), 'package.json'));

				assert.equal(newPackageJson.version, 'test-version');
			}));
		}
	},
	'release-publish-flat': (function () {
		let runStub: SinonStub;

		return {
			beforeEach() {
				runStub = stub(grunt.task, 'run');

				// save our actual package.json
				grunt.file.copy('package.json', 'package.json.bak');
			},

			afterEach() {
				runStub.restore();

				taskUnloader();

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
				runGruntTask('release-publish-flat');

				assert.isTrue(runStub.calledOnce);
				assert.deepEqual((<any> runStub).getCalls()[ 0 ].args[ 0 ], [ 'copy:temp', 'release-publish', 'clean:temp' ]);

				const newPackageJson = grunt.file.readJSON(path.join('temp', 'package.json'));

				assert.isUndefined(newPackageJson.private);
				assert.isUndefined(newPackageJson.scripts);
				assert.isUndefined(newPackageJson.files);
				assert.equal(newPackageJson.typings, 'index.d.ts');
				assert.equal(newPackageJson.main, 'index.js');

				assert.isTrue(grunt.file.exists('temp/README.md'));
			},

			'run w/o no extras'() {
				grunt.file.copy('README.md', 'README.md.bak');
				grunt.file.delete('README.md');

				runGruntTask('release-publish-flat');

				assert.isFalse(grunt.file.exists('temp/README.md'));
			}
		};
	})(),
	release: (function () {
		let failStub: SinonStub;
		let runStub: SinonStub;

		return {
			beforeEach() {
				failStub = stub(grunt.fail, 'fatal').throws();
				runStub = stub(grunt.task, 'run');
			},

			afterEach() {
				failStub.restore();
				runStub.restore();

				taskUnloader();
			},

			'skipChecks on non dry run'() {
				let caughtError: Error | null = null;

				taskLoader(undefined, {
					'dry-run': false,
					'skip-checks': true
				});

				try {
					runGruntTask('release');
				} catch (e) {
					caughtError = e;
				} finally {
					assert.isNotNull(caughtError);
					assert.isTrue(failStub.calledOnce);
				}
			},

			'run with no version'() {
				let caughtError: Error | null = null;

				taskLoader(undefined, {});

				try {
					runGruntTask('release');
				} catch (e) {
					caughtError = e;
				} finally {
					assert.isNotNull(caughtError);
					assert.isTrue(failStub.calledOnce);
				}
			},

			'run w/ prerelease tags'() {
				taskLoader(undefined, {
					'pre-release-tag': 'beta'
				});

				runGruntTask('release');

				assert.isTrue(runStub.calledOnce);
				assert.deepEqual((<any> runStub).getCalls()[ 0 ].args[ 0 ], [
					'can-publish-check',
					'repo-is-clean-check',
					'dist',
					'release-version-pre-release-tag',
					'release-publish-flat',
					'post-release-version'
				]);
			},

			'run w/ prerelease tags w/ skipchecks'() {
				taskLoader(undefined, {
					'pre-release-tag': 'beta',
					'skip-checks': true,
					'dry-run': true
				});

				runGruntTask('release');

				assert.isTrue(runStub.calledOnce);
				assert.deepEqual((<any> runStub).getCalls()[ 0 ].args[ 0 ], [
					'dist',
					'release-version-pre-release-tag',
					'release-publish-flat',
					'post-release-version'
				]);
			},

			'run w/ release tag and version'() {
				taskLoader(undefined, {
					'release-version': '1.2.3-alpha',
					'next-version': '1.2.3'
				});

				runGruntTask('release');

				assert.isTrue(runStub.calledOnce);
				assert.deepEqual((<any> runStub).getCalls()[ 0 ].args[ 0 ], [
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
