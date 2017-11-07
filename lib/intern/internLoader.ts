declare const shimAmdDependencies: any;

intern.registerLoader((options) => {
	return intern.loadScript('node_modules/@dojo/loader/loader.js')
		.then(() => intern.loadScript('node_modules/@dojo/shim/util/amd.js'))
		.then(() => {
			const { packages = [], baseUrl = intern.config.basePath } = options;
			packages.push({ 'name': 'sinon', 'location': 'node_modules/sinon/pkg', 'main': 'sinon' });

			(<any> require).config(shimAmdDependencies({
				baseUrl,
				...options,
				packages
			}));

			// load @dojo/shim/main to import the ts helpers
			return new Promise<void>((resolve) => {
				(<any> require)(['@dojo/shim/main'], () => {
					resolve();
				});
			});
		}).then(() => {
			return (modules: string[]) => {
				return new Promise<void>((resolve, reject) => {
					(<any> require)(modules, () => resolve());
				});
			};
		});
});
