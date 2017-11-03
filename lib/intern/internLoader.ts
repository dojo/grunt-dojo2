declare const shimAmdDependencies: any;

// this file is loaded directly by intern, thus coverage is not available.
/* istanbul ignore next */
intern.registerLoader((options) => {
	return intern.loadScript('node_modules/@dojo/loader/loader.js')
		.then(() => intern.loadScript('node_modules/@dojo/shim/util/amd.js'))
		.then(() => {
			(<any> require).config(shimAmdDependencies({
				baseUrl: options.baseUrl || intern.config.basePath,
				packages: [
					{'name': 'sinon', 'location': 'node_modules/sinon/pkg', 'main': 'sinon'}
				]
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
