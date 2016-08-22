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
	noImplicitThis?: boolean;
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
	if (options['noImplicitThis']) {
		additionalFlags.push('--noImplicitThis');
		options.noImplicitThis = false;
	}

	options.additionalFlags = additionalFlags.join(' ');

	return options;
}

function getTsTaskOptionsLegacy(compilerOptions: any): any {
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
				declaration: true,
				sourceMap: true,
				inlineSources: true
			}),
			outDir: 'dist/umd',
			src: [ '<%= skipTests %>' ]
		},
		dts: {
			options: getTsOptions(tsOptions, {
				declaration: true
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
}

function getTsTaskOptions(grunt: IGrunt, tsconfig: any): any {
	const writeOptions = {
		encoding: 'UTF8'
	};
	const distDir = grunt.config.get<any>('distDirectory');
	const skipTests = grunt.config.get<string[]>('testsGlob');
	const otherOptions = grunt.config.get<any>('otherOptions');
	const tsOverrides = otherOptions.ts ? otherOptions.ts : {};

	const includeGlob: string[] = tsconfig.include || [];

	const tsconfigDist = Object.assign({}, tsconfig, {
		include: includeGlob.filter((item: string) => skipTests.indexOf(item) === -1)
	});
	tsconfigDist.compilerOptions = Object.assign({}, tsconfig.compilerOptions, {
		outDir: distDir,
		declaration: true
	}, tsOverrides.dist);

	const tsconfigDistEsm = Object.assign({}, tsconfig, {
		include: includeGlob.filter((item: string) => skipTests.indexOf(item) === -1)
	});
	tsconfigDistEsm.compilerOptions = Object.assign({}, tsconfig.compilerOptions, {
		target: 'es6',
		module: 'es6',
		sourceMap: false,
		outDir: 'dist/esm',
		inlineSourceMap: true,
		inlineSources: true
	}, tsOverrides.esm);

	grunt.file.write('.tsconfigDist.json', JSON.stringify(tsconfigDist), writeOptions);
	grunt.file.write('.tsconfigEsm.json', JSON.stringify(tsconfigDistEsm), writeOptions);

	const customTargets: any = {};

	Object.keys(tsOverrides).forEach((target) => {
		if (target !== 'dist' && target !== 'esm' && target !== 'dev') {
			const customTarget = tsOverrides[target];
			const customTargetOptions: { include?: string[], exclude?: string[] } = {};
			if (customTarget.include) {
				customTargetOptions.include = customTarget.include;
			}
			if (customTarget.exclude) {
				customTargetOptions.exclude = customTarget.exclude;
			}
			const customTsconfig = Object.assign({}, tsconfig, customTargetOptions);
			const customCompilerOptions = customTarget.compilerOptions ? customTarget.compilerOptions : {};

			customTsconfig.compilerOptions = Object.assign({}, tsconfig.compilerOptions, customCompilerOptions);

			grunt.file.write('.tsconfig' + target + '.json', JSON.stringify(customTsconfig), writeOptions);
			customTargets[target] = {
				tsconfig: {
					tsconfig: '.tsconfig' + target + '.json',
					passThrough: true
				}
			};
		}
	});

	return Object.assign({
		options: {
			failOnTypeErrors: true,
			fast: 'never'
		},
		dev: {
			tsconfig: {
				passThrough: true
			}
		},
		dist: {
			tsconfig: {
				tsconfig: '.tsconfigDist.json',
				passThrough: true
			}
		},
		dts: {
			tsconfig: {
				tsconfig: '.tsconfigDist.json',
				passThrough: true
			}
		},
		dist_esm: {
			tsconfig: {
				tsconfig: '.tsconfigEsm.json',
				passThrough: true
			}
		}
	}, customTargets);
}

export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-ts');

	const tsconfig = grunt.config.get<any>('tsconfig');
	if (tsconfig.compilerOptions.paths) {
		return getTsTaskOptions(grunt, tsconfig);
	}

	return getTsTaskOptionsLegacy(tsconfig.compilerOptions);
};
