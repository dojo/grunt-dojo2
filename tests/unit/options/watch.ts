import { SinonSandbox } from 'sinon';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as path from 'path';
import * as grunt from 'grunt';
import { getInputDirectory } from '../util';
import * as sinon from 'sinon';

const configPath = path.resolve(getInputDirectory() + '/intern.json');

const optionPath = '../../../options/watch';
let sandbox: SinonSandbox;

registerSuite('options/watch', {
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

			assert.isNotNull(config.grunt);
			assert.isNotNull(config.grunt.options);
			assert.isNotNull(config.grunt.options.reload);
			assert.isNotNull(config.grunt.options.files);
			assert.isNotNull(config.src);
			assert.isNotNull(config.src.options);
			assert.isNotNull(config.src.options.atBegin);
			assert.isNotNull(config.src.files);
			assert.isNotNull(config.src.tasks);
			assert.isNotNull(config.src.tasks.dev);
		}
	}
});
