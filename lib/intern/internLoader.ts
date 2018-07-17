declare const shimAmdDependencies: any;

intern.registerLoader(async (options: any) => {
	const {
		packages = [],
		map = {},
		baseUrl = intern.config.basePath,
		loaderPath = 'node_modules/@dojo/loader/loader.js',
		shimPath = 'node_modules/@dojo/framework/shim/util/amd.js'
	} = options;

	await intern.loadScript(loaderPath);
	await intern.loadScript(shimPath);

	(require as any).config(
		shimAmdDependencies({
			baseUrl,
			...options,
			packages: [
				...packages,
				{
					name: 'cldr-data',
					location: 'node_modules/cldr-data'
				},
				{
					name: 'cldrjs',
					location: 'node_modules/cldrjs'
				},
				{
					name: 'globalize',
					location: 'node_modules/globalize',
					main: 'dist/globalize'
				},
				{
					name: 'css-select-umd',
					location: 'node_modules/css-select-umd',
					main: 'dist/index.js'
				},
				{
					name: 'diff',
					location: 'node_modules/diff',
					main: 'dist/diff.js'
				},
				{
					name: 'sinon',
					location: 'node_modules/sinon/pkg',
					main: 'sinon'
				}
			],
			map: {
				...map,
				globalize: {
					cldr: 'cldrjs/dist/cldr',
					'cldr/event': 'cldrjs/dist/cldr/event',
					'cldr/supplemental': 'cldrjs/dist/cldr/supplemental',
					'cldr/unresolved': 'cldrjs/dist/cldr/unresolved'
				}
			}
		})
	);

	await new Promise<void>((resolve) => {
		(require as any)(['@dojo/framework/shim/main'], () => {
			resolve();
		});
	});

	return (modules: string[]) => {
		return new Promise<void>((resolve, reject) => {
			(require as any)(modules, () => resolve());
		});
	};
});
