const repl = require('repl');

import loadDojoLoader from '../lib/load-dojo-loader';

const resolveFrom = require('resolve-from');

export = function(grunt: IGrunt, packageJson: any) {
	grunt.registerTask('repl', 'Bootstrap dojo-loader and start a Node.js REPL', function () {
		this.async(); // Ensure Grunt doesn't exit the process.

		const { baseUrl, packages, require: dojoRequire } = loadDojoLoader(packageJson);

		const nodeRequire = function (mid: string) {
			// Require relative to the baseUrl, not this module.
			return require(resolveFrom(baseUrl, mid));
		};
		Object.defineProperty(nodeRequire, 'resolve', {
			configurable: false,
			enumerable: true,
			value (mid: string) {
				return resolveFrom(baseUrl, mid);
			}
		});

		grunt.log.ok(`Available packages: ${packages.map(({ name }) => name).join(', ')}`);
		grunt.log.ok('require() is now powered by dojo-loader');
		grunt.log.ok('Node.js\' require() is available under nodeRequire()');

		const { context } = repl.start();
		Object.defineProperties(context, {
			nodeRequire: {
				configurable: false,
				enumerable: true,
				value: nodeRequire
			},
			require: {
				configurable: false,
				enumerable: true,
				value: dojoRequire
			}
		});
	});
};
