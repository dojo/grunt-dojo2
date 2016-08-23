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
	return getTsTaskOptions(grunt, tsconfig);
};
