import * as path from 'path';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as mockery from 'mockery';

registerSuite('lib/load-dojo-loader', {
	before: function () {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		});
	},
	after: function () {
		mockery.disable();
	},

	tests: {
		run: function () {
			mockery.registerMock('resolve-from', function (baseUrl: string, mid: string) {
				return '/' + mid;
			});

			let configBaseUrl: string = '';
			let configPackages: {
				name: string,
				location: string
			}[] = [];

			let fakeRequire = {
				require: function () {
				},
				config: function (obj: any) {
					configBaseUrl = obj.baseUrl;
					configPackages = obj.packages;
				}
			};

			mockery.registerMock('/dojo-loader', fakeRequire);

			let loader = require('../../../lib/load-dojo-loader').default;

			let result = loader({
				peerDependencies: {
					'test': 'test',
					'dojo-loader': 'dojo-loader',
					'@reactivex/rxjs': true,
					'maquette': true,
					'immutable': true
				}
			});

			assert.equal(configBaseUrl, process.cwd());
			assert.deepEqual(configPackages, [
				{ name: 'src', location: path.join('_build', 'src') },
				{ name: 'test', location: path.join('node_modules', 'test') },
				{ name: 'dojo-loader', location: path.join('node_modules', 'dojo-loader', 'dist', 'all') },
				{ name: 'rxjs', location: path.join('node_modules', '@reactivex', 'rxjs', 'dist', 'amd') },
				{ name: 'maquette', location: path.join('node_modules', 'maquette', 'dist') },
				{ name: 'immutable', location: path.join('node_modules', 'immutable', 'dist') }
			]);

			assert.equal(result.baseUrl, configBaseUrl);
			assert.deepEqual(result.packages, configPackages);
			assert.equal(result.require, fakeRequire);
		}
	}
});
