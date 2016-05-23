interface GenericObject {
	[ key: string ]: any;
}

function mixin<T extends GenericObject, U extends GenericObject>(destination: T, source: U): T & U {
	for (let key in source) {
		destination[key] = source[key];
	}
	return <T & U> destination;
}

interface GruntTSOptions {
	[ option: string ]: string | number | boolean;
	experimentalDecorators?: boolean;
	inlineSources?: boolean;
	inlineSourceMap?: boolean;
	sourceMap?: boolean;
	additionalFlags?: string;
	strictNullChecks?: boolean;
	mapRoot?: string;
}

/**
 * A work-around for grunt-ts 4.2.0-beta not handling experimentalDecorators
 * and improperly handling the source map options
 */
function getTsOptions(baseOptions: GruntTSOptions, overrides: GruntTSOptions) {
	let options = mixin({}, baseOptions);
	if (overrides) {
		options = mixin(options, overrides);
	}

	const additionalFlags = options.experimentalDecorators ? [ '--experimentalDecorators' ] : [];

	if (options.inlineSources) {
		additionalFlags.push('--inlineSources');
	}
	if (options.inlineSourceMap) {
		additionalFlags.push('--inlineSourceMap');
	}
	if (options.sourceMap) {
		additionalFlags.push('--sourceMap');
	}
	options.inlineSources = options.inlineSourceMap = options.sourceMap = false;
	if (options.mapRoot) {
		additionalFlags.push('--mapRoot', options.mapRoot);
		delete options.mapRoot;
	}
	/* Supported in TypeScript 2.0 */
	if (options['strictNullChecks']) {
		additionalFlags.push('--strictNullChecks');
		options.strictNullChecks = false;
	}

	options.additionalFlags = additionalFlags.join(' ');

	return options;
}

export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-ts');

	const compilerOptions = grunt.config.get<any>('tsconfig').compilerOptions;
	const tsOptions = getTsOptions(compilerOptions, {
		failOnTypeErrors: true,
		fast: 'never'
	});
	return {
		options: tsOptions,
		dev: {
			outDir: '<%= devDirectory %>',
			src: [ '<%= all %>' ]
		},
		dist: {
			options: getTsOptions(tsOptions, {
				mapRoot: '../dist/umd/_debug',
				sourceMap: true,
				inlineSources: true
			}),
			outDir: 'dist/umd',
			src: [ '<%= skipTests %>' ]
		},
		dist_esm: {
			options: getTsOptions(tsOptions, {
				target: 'es6',
				module: 'es6',
				sourceMap: false,
				inlineSourceMap: true,
				inlineSources: true
			}),
			outDir: 'dist/esm',
			src: [ '<%= skipTests %>' ]
		}
	};
};
