import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';

registerSuite({
	name: 'lib/load-dojo-loader',
	setup: function () {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true
		});
	},
	teardown: function () {
		mockery.disable();
	},

	run: function () {
		mockery.registerMock('resolve-from', function (baseUrl: string, mid: string) {
			return '/' + mid;
		});

		let configBaseUrl: string;
		let configPackages: {
			name: string,
			location: string
		}[];

		let fakeRequire = {
			require: function () {
			},
			config: function (obj: any) {
				configBaseUrl = obj.baseUrl;
				configPackages = obj.packages;
			}
		};

		mockery.registerMock('/dojo-loader', fakeRequire);

		let loader = (<any> require).nodeRequire('../../lib/load-dojo-loader').default;

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
			{ name: 'src', location: '_build/src' },
			{ name: 'test', location: 'node_modules/test' },
			{ name: 'dojo-loader', location: 'node_modules/dojo-loader/dist/umd' },
			{ name: 'rxjs', location: 'node_modules/@reactivex/rxjs/dist/amd' },
			{ name: 'maquette', location: 'node_modules/maquette/dist' },
			{ name: 'immutable', location: 'node_modules/immutable/dist' }
		]);

		assert.equal(result.baseUrl, configBaseUrl);
		assert.deepEqual(result.packages, configPackages);
		assert.equal(result.require, fakeRequire);
	}
});
