const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as grunt from 'grunt';
import { SinonStub, stub } from 'sinon';
import { loadTasks, unloadTasks, runGruntTask } from '../util';

let mockLogger: SinonStub;
let mockErrorLogger: SinonStub;
let mockShell: SinonStub;

registerSuite('tasks/installPeerDependencies', {
	afterEach() {
		mockShell.reset();
		mockLogger.restore();
		mockErrorLogger.restore();
		unloadTasks();
	},
	tests: {
		'npm': {
			beforeEach() {
				grunt.initConfig({});
				mockErrorLogger = stub(grunt.log, 'error');
				mockLogger = stub(grunt.log, 'write');
				mockShell = stub();

				mockShell
				.withArgs('npm install my-dep@"1.0" --no-save').returns(Promise.resolve({}))
				.withArgs('npm install my-dep@"1.0" error-dep@"1.0" --no-save').throws();
			},
			tests: {
				'sucessfully install peer dependencies'() {
					loadTasks({
						child_process: {
							execSync: mockShell
						}
					}, {
						peerDependencies: {
							'my-dep': '1.0'
						}
					});
					runGruntTask('peerDepInstall');

					assert.isTrue(mockShell.calledOnce);
					assert.isTrue(mockShell.calledWith('npm install my-dep@"1.0" --no-save'));
					assert.isTrue(mockLogger.calledOnce);
					assert.isTrue(mockErrorLogger.notCalled);
				},
				'fail to install peer dependencies'() {
					loadTasks({
						child_process: {
							execSync: mockShell
						}
					}, {
						peerDependencies: {
							'my-dep': '1.0',
							'error-dep': '1.0'
						}
					});
					runGruntTask('peerDepInstall');

					assert.isTrue(mockShell.calledOnce);
					assert.isTrue(mockShell.calledWith('npm install my-dep@"1.0" error-dep@"1.0" --no-save'));
					assert.isTrue(mockLogger.calledOnce);
					assert.isTrue(mockErrorLogger.calledWith('failed.'));
				},
				'no peer deps found'() {
					loadTasks({
						child_process: {
							execSync: mockShell
						}
					}, {
						peerDependencies: {
						}
					});
					runGruntTask('peerDepInstall');

					assert.isTrue(mockShell.notCalled);
					assert.isTrue(mockLogger.calledWith('No peer dependencies detected.'));
					assert.isTrue(mockErrorLogger.notCalled);
				}
			}
		}
	}
});
