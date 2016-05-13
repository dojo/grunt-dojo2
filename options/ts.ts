interface GenericObject {
	[ key: string ]: any;
}

function mixin<T extends GenericObject, U extends GenericObject>(destination: T, source: U): T & U {
	for (var key in source) {
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
}

/**
 * A work-around for grunt-ts 4.2.0-beta not handling experimentalDecorators
 * and improperly handling the source map options
 */
function getTsOptions(baseOptions: GruntTSOptions, overrides: GruntTSOptions) {
	var options = mixin({}, baseOptions);
	if (overrides) {
		options = mixin(options, overrides);
	}
	var additionalFlags = options.experimentalDecorators ? [ '--experimentalDecorators' ] : [];
	if (options.inlineSources) {
		additionalFlags.push('--inlineSources');
	}
	if (options.inlineSourceMap) {
		additionalFlags.push('--inlineSourceMap');
	}
	if (options.sourceMap) {
		additionalFlags.push('--sourceMap');
	}
	/* Supported in TypeScript 2.0 */
	if (options['strictNullChecks']) {
		additionalFlags.push('--strictNullChecks');
	}
	options.inlineSources = options.inlineSourceMap = options.sourceMap = false;

	options.additionalFlags = additionalFlags.join(' ');

	return options;
}

export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-ts');

	var compilerOptions = grunt.config.get<any>('tsconfig').compilerOptions;
	var tsOptions = getTsOptions(compilerOptions, {
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
			}),
			outDir: 'dist/umd',
			src: [ '<%= skipTests %>' ]
		},
		dist_esm: {
			options: getTsOptions(tsOptions, {
				mapRoot: '../dist/esm/_debug',
				sourceMap: true,
				inlineSources: true,
				target: 'es6',
				module: 'es6'
			}),
			outDir: 'dist/esm',
			src: [ '<%= skipTests %>' ]
		}
	};
};
