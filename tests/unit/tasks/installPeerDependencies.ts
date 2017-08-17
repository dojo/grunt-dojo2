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
			.withArgs('npm install my-dep@"1.0" --no-save').returns(Promise.resolve({}))
			.withArgs('npm install error-dep@"1.0" --no-save').throws();

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

			assert.isTrue(mockShell.calledTwice);
			assert.isTrue(mockShell.calledWith('npm install my-dep@"1.0" --no-save'));
			assert.isTrue(mockShell.calledWith('npm install error-dep@"1.0" --no-save'));
			assert.isTrue(mockLogger.called);
			assert.isTrue(mockLogger.calledWith('failed.'));
		}
	}
});
