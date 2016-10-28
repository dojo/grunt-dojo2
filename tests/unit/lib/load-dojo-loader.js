define([
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!mockery',
	'intern/dojo/node!process'
], function(registerSuite, assert, mockery, process) {

	registerSuite({
		name: 'lib/load-dojo-loader',
		setup: function() {
			mockery.enable();
		},
		teardown: function() {
			mockery.disable();
		},

		run: function() {
			mockery.registerMock('resolve-from', function(baseUrl, mid) {
				return '/' + mid;
			});

			let configBaseUrl;
			let configPackages;

			let fakeRequire = {
				require: function() {
				},
				config: function(obj) {
					configBaseUrl = obj.baseUrl;
					configPackages = obj.packages;
				}
			};

			mockery.registerMock('/dojo-loader', fakeRequire);

			let loader = require.nodeRequire('../../lib/load-dojo-loader').default;

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
				{name: 'src', location: '_build/src'},
				{name: 'test', location: 'node_modules/test'},
				{name: 'dojo-loader', location: 'node_modules/dojo-loader/dist/umd'},
				{name: 'rxjs', location: 'node_modules/@reactivex/rxjs/dist/amd'},
				{name: 'maquette', location: 'node_modules/maquette/dist'},
				{name: 'immutable', location: 'node_modules/immutable/dist'}
			]);

			assert.equal(result.baseUrl, configBaseUrl);
			assert.deepEqual(result.packages, configPackages);
			assert.equal(result.require, fakeRequire);
		}
	});
});
