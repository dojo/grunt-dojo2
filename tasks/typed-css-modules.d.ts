declare module 'typed-css-modules' {
	import typedCssModules = require('typed-css-modules/index');

	export = typedCssModules;
}

declare module 'typed-css-modules/index' {
	class DtsContent {
		writeFile(): Promise<DtsContent>;
	}

	class DtsCreator {
		constructor(options?: { rootDir?: string; searchDir?: string; outDir?: string; camelCase?: boolean });

		create(filePath: string, contents?: string): Promise<DtsContent>;
	}

	namespace DtsCreator {

	}

	export = DtsCreator;
}
