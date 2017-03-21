import * as grunt from 'grunt';
import * as path from 'path';
import * as mockery from 'mockery';
import * as _ from 'lodash';
import { IRootRequire } from 'dojo/loader';

declare const require: IRootRequire;

export interface MockList {
	[key: string]: any;
}

export interface TaskLoadingOptions {
	peerDependencies?: {
		[key: string]: any;
	};
}

export function createDummyFile(name: string, data?: string) {
	grunt.file.write(path.join(getInputDirectory(), name), data ? data : '', {
		encoding: 'utf-8'
	});
}

export function createDummyDirectory(name: string) {
	const filePath = path.join(getInputDirectory(), name);
	grunt.file.mkdir(filePath);
}

export function getInputDirectory() {
	return './grunt-dojo2_debug-in';
}

export function getOutputDirectory() {
	return './grunt-dojo2_debug-out';
}

export function prepareInputDirectory() {
	grunt.file.mkdir(getInputDirectory());
}

export function prepareOutputDirectory() {
	grunt.file.mkdir(getOutputDirectory());
}

export function cleanInputDirectory() {
	grunt.file.delete(getInputDirectory());
}

export function cleanOutputDirectory() {
	grunt.file.delete(getOutputDirectory());
}

export function runGruntTask(taskName: string, callback?: () => void) {
	const task = (<any> grunt.task)._taskPlusArgs(taskName);

	return task.task.fn.apply({
		nameArgs: task.nameArgs,
		name: task.task.name,
		args: task.args,
		flags: task.flags,
		async: function () {
			return callback;
		}
	}, task.args);
}

export function fileExistsInOutputDirectory(fileName: string) {
	return grunt.file.exists(path.join(getOutputDirectory(), fileName));
}

export function fileExistsInInputDirectory(fileName: string) {
	return grunt.file.exists(path.join(getInputDirectory(), fileName));
}

function registerMockList(mocks: MockList) {
	const keys = Object.keys(mocks);

	for (let i = 0; i < keys.length; i++) {
		mockery.registerMock(keys[i], mocks[keys[i]]);
	}
}

export function loadModule(mid: string, mocks: MockList = {}, returnDefault = true): any {
	mockery.enable({
		warnOnReplace: false,
		warnOnUnregistered: false,
		useCleanCache: true
	});
	mockery.resetCache();

	registerMockList(mocks);

	const loader = require.nodeRequire || require;
	const module = loader(require.toUrl(mid));
	return returnDefault ? module.default : module;
}

export function loadTasks(mocks?: MockList, options?: TaskLoadingOptions) {
	mockery.enable({
		warnOnReplace: false,
		warnOnUnregistered: false,
		useCleanCache: true
	});
	mockery.resetCache();

	mockery.registerMock('lodash', _);

	// Registering this mock as it has problems with `regenerate` from regexpu-core.
	mockery.registerMock('postcss-modules', function noop() {});

	if (mocks) {
		registerMockList(mocks);
	}

	grunt.registerTask('clean', 'Clean mock task', () => {
	});

	const packageJson = grunt.file.readJSON('package.json');

	if (options && options.peerDependencies) {
		packageJson.peerDependencies = options.peerDependencies;
	}

	grunt.file.expand([ 'tasks/*.js' ]).forEach((fileName) => {
		(<any> require).nodeRequire('../../' + fileName.substr(0, fileName.length - 3))(grunt, packageJson);
	});

	// suppress grunt logging
	(<any> grunt.log)._write = () => {
	};
}

export function unloadTasks() {
	mockery.deregisterAll();
	mockery.disable();
}
