define({
	loaderOptions: {
		packages: [
			{ name: 'grunt-dojo2', location: '.' }
		]
	},

	suites: [ 'grunt-dojo2/tests/unit/all' ],

	excludeInstrumentation: /^(?:tests|node_modules)\//
});
