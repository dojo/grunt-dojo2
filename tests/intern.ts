import 'intern';

export const loaderOptions = {
	packages: [{ name: 'grunt-dojo2', location: '.' }]
};

export const suites = ['grunt-dojo2/tests/unit/all'];

export const excludeInstrumentation = /^(?:tests|node_modules)\//;

export const loaders = {
	'host-node': 'dojo-loader'
};

export const filterErrorStack = true;
