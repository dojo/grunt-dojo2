export = function (grunt: IGrunt) {
	const { exec } = require('shelljs');

	return {
		options: {
			// All options but publishOptions are passed directly to the typedoc command line.
			mode: 'modules',
			externalPattern: '**/+(example|examples|node_modules|tests|typings)/**/*.ts',
			excludeExternals: true,
			excludeNotExported: true,
			includeDeclarations: true,

			// publishOptions are only used when publishing the generate API docs
			publishOptions: {
				branch: 'gh-pages',
				subdir: 'api',

				// shouldPush is a function that indicates whether doc updates should be pushed to the origin
				shouldPush: function () {
					const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).stdout.trim();
					const keyTag = process.env['SSH_KEY_TAG'];
					const keyVar = process.env[`encrypted_${keyTag}_key`];
					return branch === 'master' && keyVar;
				}
			}
		}
	};
};
