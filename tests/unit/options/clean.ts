import { SinonSandbox } from 'sinon';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as path from 'path';
import * as grunt from 'grunt';
import { getInputDirectory } from '../util';
import * as sinon from 'sinon';

const configPath = path.resolve(getInputDirectory() + '/intern.json');

const optionPath = '../../../options/clean';
let sandbox: SinonSandbox;

registerSuite('options/clean', {
	before() {
		grunt.initConfig({
			internConfig: configPath
		});
	},
	beforeEach() {
		sandbox = sinon.sandbox.create();
	},
	afterEach() {
		sandbox.restore();
		delete require.cache[ require.resolve(optionPath) ];
	},
	tests: {
		'loads options'() {
			const config = require(optionPath)({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{}';
					}
				}
			});

			assert.isNotNull(config.typings);
			assert.isNotNull(config.dist);
			assert.isNotNull(config.dist.filter);
			assert.isNotNull(config.dev);
			assert.isNotNull(config.src);
			assert.isNotNull(config.src.filter);
			assert.isNotNull(config.coverage);
			assert.isNotNull(config.typedoc);
			assert.isNotNull(config.ghpages);
		},

		'dist/filter - remove links'() {
			const optionStub = sandbox.stub().returns(true);
			const isLinkStub = sandbox.stub().returns(false);
			const config = require(optionPath)({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{}';
					},
					isLink: isLinkStub
				},
				option: optionStub
			});
			assert.isTrue(config.dist.filter('foo'));
			assert.isTrue(optionStub.calledWith('remove-links'));
			assert.isFalse(isLinkStub.called);
		},

		'dist/filter - do not remove links'() {
			const optionStub = sandbox.stub().returns(false);
			const isLinkStub = sandbox.stub().returns(true);
			const config = require(optionPath)({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{}';
					},
					isLink: isLinkStub
				},
				option: optionStub
			});
			assert.isFalse(config.dist.filter('foo'));
			assert.isTrue(optionStub.calledWith('remove-links'));
			assert.isTrue(isLinkStub.calledWith('foo'));
		},

		'src/filter - does not exist'() {
			const existsStub = sandbox.stub().returns(false);
			const deleteStub = sandbox.stub().returns(true);
			const config = require(optionPath)({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{}';
					},
					exists: existsStub,
					delete: deleteStub
				}
			});
			assert.isFalse(config.src.filter('foo'), 'Bad filter return value');
			assert.isTrue(existsStub.calledWith('foo.map'), 'exists was not called correctly');
			assert.isFalse(deleteStub.called, 'delete was called');
		},

		'src/filter - exists'() {
			const existsStub = sandbox.stub().returns(true);
			const deleteStub = sandbox.stub().returns(true);
			const config = require(optionPath)({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{}';
					},
					exists: existsStub,
					delete: deleteStub
				}
			});
			assert.isTrue(config.src.filter('foo'), 'Bad filter return value');
			assert.isTrue(existsStub.calledWith('foo.map'), 'exists was not called correctly');
			assert.isTrue(deleteStub.called, 'delete was called');
		}
	}
});
