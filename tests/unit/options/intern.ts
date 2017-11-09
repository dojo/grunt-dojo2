const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as path from 'path';
import * as grunt from 'grunt';
import { getInputDirectory } from '../util';

const configPath = path.resolve(getInputDirectory() + '/intern.json');

registerSuite('options/intern', {
	before() {
		grunt.initConfig({
			internConfig: configPath
		});
	},
	afterEach() {
		delete require.cache[require.resolve('../../../options/intern')];
	},
	tests: {
		'uses loader specified in the intern config root'() {
			const config = require('../../../options/intern')({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{ "loader": "test" }';
					}
				}
			});

			assert.isTrue(config.options.browser.loader === undefined);
		},
		'uses loader specified in the intern config root containing comments'() {
			const config = require('../../../options/intern')({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{ "loader": "test"/*, "suites": []*/ }';
					}
				}
			});

			assert.isTrue(config.options.browser.loader === undefined);
		},
		'uses loader specified in the intern browser config'() {
			const config = require('../../../options/intern')({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{ "browser": { "loader": "test" } }';
					}
				}
			});

			assert.isTrue(config.options.browser.loader === undefined);
		},
		'injects loader if its empty'() {
			const config = require('../../../options/intern')({
				...grunt,
				loadNpmTasks() {
				},
				file: {
					read() {
						return '{}';
					}
				}
			});

			assert.isTrue(config.options.browser.loader === './node_modules/grunt-dojo2/lib/intern/internLoader.js');
		}
	}
});
