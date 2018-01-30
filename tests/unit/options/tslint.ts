import { SinonSandbox } from 'sinon';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as path from 'path';
import * as grunt from 'grunt';
import { getInputDirectory } from '../util';
import * as sinon from 'sinon';

const configPath = path.resolve(getInputDirectory() + '/intern.json');

const optionPath = '../../../options/tslint';
let sandbox: SinonSandbox;

registerSuite('options/tslint', {
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
					},
					readJSON: sandbox.stub().returns({})
				}
			});

			assert.isNotNull(config.options);
			assert.isNotNull(config.options.configuration);
			assert.isNotNull(config.src);
			assert.isNotNull(config.src.src);
		}
	}
});
