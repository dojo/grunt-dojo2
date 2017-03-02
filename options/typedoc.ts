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
				subdir: 'api',
				deployKey: 'deploy_key'
			}
		}
	};
};
