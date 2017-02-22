import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as grunt from 'grunt';
import { SinonStub, stub } from 'sinon';
import { loadTasks, unloadTasks, runGruntTask } from '../util';

let mockLogger: SinonStub;
let mockShell: SinonStub;

registerSuite({
	name: 'tasks/installPeerDependencies',
	afterEach() {
		mockLogger.restore();
		unloadTasks();
	},
	'npm': {
		beforeEach() {
			grunt.initConfig({});
			mockLogger = stub(grunt.log, 'error');
			mockShell = stub();

			mockShell
			.withArgs('yarn --version').throws()
			.withArgs('npm install my-dep@"1.0"').returns(Promise.resolve({}))
			.withArgs('npm install error-dep@"1.0"').throws();

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
		},
		runsCommands() {
			runGruntTask('peerDepInstall');

			assert.isTrue(mockShell.calledThrice);
			assert.isTrue(mockShell.calledWith('npm install my-dep@"1.0"'));
			assert.isTrue(mockShell.calledWith('npm install error-dep@"1.0"'));
			assert.isTrue(mockLogger.called);
			assert.isTrue(mockLogger.calledWith('failed.'));
		}
	},
	'yarn': {
		beforeEach() {
			grunt.initConfig({});
			mockLogger = stub(grunt.log, 'error');
			mockShell = stub();

			mockShell
			.withArgs('yarn --version').returns(Promise.resolve({}))
			.withArgs('yarn add --ignore-engines my-dep@"1.0"').returns(Promise.resolve({}))
			.withArgs('yarn add --ignore-engines error-dep@"1.0"').throws();

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
		},
		runsCommands() {
			runGruntTask('peerDepInstall');

			assert.isTrue(mockShell.calledThrice);
			assert.isTrue(mockShell.calledWith('yarn add --ignore-engines my-dep@"1.0"'));
			assert.isTrue(mockShell.calledWith('yarn add --ignore-engines error-dep@"1.0"'));
			assert.isTrue(mockLogger.called);
			assert.isTrue(mockLogger.calledWith('failed.'));
		}
	}
});
