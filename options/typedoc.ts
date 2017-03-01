export = function (grunt: IGrunt) {
	const { exec } = require('shelljs');

	return {
		options: {
			// All options but publishOptions are passed directly to the typedoc command line.
			mode: 'modules',
			externalPattern: '**/+(example|examples|node_modules|tests|typings)/**/*.ts',
			// TODO: A dummy exclude pattern is required for typedoc 0.5.6
			exclude: '_',
			excludeExternals: true,
			excludeNotExported: true,
			includeDeclarations: true,

			// publishOptions are only used when publishing the generate API docs
			publishOptions: {
				branch: 'gh-pages',
				subdir: 'api',
				encryptedDeployKey: 'deploy_key.enc',
				deployKeyTag: process.env.DEPLOY_KEY_TAG,

				// shouldPush is a function that indicates whether doc updates should be pushed to the origin
				shouldPush: function () {
					const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).stdout.trim();
					return branch === 'master';
				}
			}
		}
	};
};
