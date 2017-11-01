const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import { SinonStub, stub } from 'sinon';
import { loadTasks, unloadTasks, runGruntTask } from '../util';

let mockGlob: SinonStub;
let mockCreator: any;
let mockWriteFile: SinonStub;
let mockCreate: SinonStub;

registerSuite('tasks/tcm', {
	afterEach() {
		mockGlob.reset();
		mockCreator.reset();
		unloadTasks();
	},
	tests: {
		'npm': {
			beforeEach() {
				grunt.initConfig({});
				mockGlob = stub().callsArgWith(1, null,  [ 'one', 'two', 'three' ]);
				mockWriteFile = stub().returns(Promise.resolve());
				mockCreate = stub().returns(Promise.resolve({
					writeFile: mockWriteFile
				}));
				mockCreator = stub().returns({
					create: mockCreate
				});
			},
			tests: {
				'should generate typings for css modules'() {
					const deferred = this.async();
					loadTasks({
						glob: mockGlob,
						'typed-css-modules': mockCreator
					});
					runGruntTask('tcm', deferred.callback(() => {
						assert.isTrue(mockGlob.calledOnce);
						assert.equal(
							mockGlob.firstCall.args[0],
							'src/**/styles/*.m.css',
							'Should have searched for all .m.css files in style directories'
						);
						assert.isTrue(mockCreator.calledOnce);
						assert.deepEqual(mockCreator.firstCall.args,  [ {
							rootDir: process.cwd(),
							searchDir: 'src'
						} ]);

						assert.equal(mockCreate.callCount, 3, 'Should have called create for each file');
						assert.deepEqual(
							mockCreate.args,
							[ [ 'one' ], [ 'two' ], [ 'three' ] ],
							'Should have called create for each file'
						);
						assert.equal(mockWriteFile.callCount, 3, 'Should have called writeFile for each file');
					}));
				},

				'should fail if there is an error'() {
					const deferred = this.async();
					mockGlob.callsArgWith(1, 'error', []);
					loadTasks({
						glob: mockGlob,
						'typed-css-modules': mockCreator
					});
					runGruntTask('tcm', deferred.callback((error: any) => {
						assert.isTrue(mockGlob.calledOnce);
						assert.equal(
							mockGlob.firstCall.args[0],
							'src/**/styles/*.m.css',
							'Should have searched for all .m.css files in style directories'
						);
						assert.isTrue(mockCreator.calledOnce);
						assert.deepEqual(mockCreator.firstCall.args,  [ {
							rootDir: process.cwd(),
							searchDir: 'src'
						} ]);

						assert.isFalse(mockCreate.called, 'Should not have called create when there was an error');
						assert.isFalse(mockWriteFile.called, 'Should not have called write file when there was an error');
						assert.equal(error, 'error', 'Should have passed returned error to callback');
					}));
				}
			}
		}
	}
});
