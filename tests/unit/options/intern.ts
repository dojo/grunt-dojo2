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
		'defaults'() {
			const config = require('../../../options/intern')({
				...grunt,
				loadNpmTasks() {
				}
			});
			assert.deepEqual(config, {
				options: {
					config: '<%= internConfig %>',
					node: {
						'plugins+': [
							{ script: 'grunt-dojo2/lib/intern/Reporter.js', useLoader: true }
						],
						reporters: [
							{ name: 'runner', options: { 'hideSkipped': true, 'hidePassed': true } }
						]
					}
				},
				browserstack: {
					options: {
						config: '<%= internConfig %>@browserstack'
					}
				},
				saucelabs: {
					options: {
						config: '<%= internConfig %>@saucelabs'
					}
				},
				node: {},
				remote: {},
				local: {
					options: {
						config: '<%= internConfig %>@local'
					}
				},
				headless: {
					options: {
						config: '<%= internConfig %>@headless'
					}
				},
				serve: {
					options: {
						serveOnly: true
					}
				}
			});
		},
		'progress'() {
			const config = require('../../../options/intern')({
				...grunt,
				loadNpmTasks() {
				},
				option(name: string) {
					if (name === 'progress') {
						return true;
					}
				}
			});
			assert.deepEqual(config, {
				options: {
					config: '<%= internConfig %>',
					node: {
						'plugins+': [
							{ script: 'grunt-dojo2/lib/intern/Reporter.js', useLoader: true }
						],
						reporters: [
							{ name: 'runner', options: { 'hideSkipped': false, 'hidePassed': false } }
						]
					}
				},
				browserstack: {
					options: {
						config: '<%= internConfig %>@browserstack'
					}
				},
				saucelabs: {
					options: {
						config: '<%= internConfig %>@saucelabs'
					}
				},
				node: {},
				remote: {},
				local: {
					options: {
						config: '<%= internConfig %>@local'
					}
				},
				headless: {
					options: {
						config: '<%= internConfig %>@headless'
					}
				},
				serve: {
					options: {
						serveOnly: true
					}
				}
			});
		}
	}
});
