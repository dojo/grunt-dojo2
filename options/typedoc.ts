export = function (_grunt: IGrunt) {
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
				deployKey: 'deploy_key',
				subDirectory: 'api',
				publishMode() {
					// Require that the API doc deployment is explicitly requested in an environment variable
					// this allows us to turn it off without needing to make a commit and allows forking repos
					// to select their own settings without changing code
					const deploy = process.env.DEPLOY_DOCS;
					return process.env.TRAVIS_BRANCH === 'master' && deploy;
				}
			}
		}
	};
};
