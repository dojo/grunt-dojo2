import * as _ from 'lodash';

export = function(grunt: IGrunt) {
	const distDirectory = grunt.config.get<string>('distDirectory');
	const defaultOptions: any = {
		dist: {
			exclude: ['tests/**/*.ts'],
			compilerOptions: {
				outDir: distDirectory,
				declaration: true
			}
		},
		esm: {
			exclude: ['tests/**/*.ts'],
			compilerOptions: {
				target: 'es6',
				module: 'es6',
				sourceMap: false,
				outDir: 'dist/esm',
				inlineSourceMap: true,
				inlineSources: true
			}
		}
	};

	grunt.registerTask('ts', <any> function () {
		grunt.loadNpmTasks('grunt-ts');
		const flags = this.args && this.args.length ? this.args : [ 'dev' ];
		const tsconfig = grunt.config.get<any>('tsconfig');
		const tsOptions = grunt.config.get<any>('ts') || {};
		const baseOptions = {
			failOnTypeErrors: true,
			fast: 'never'
		};

		grunt.config.set('ts.options', baseOptions);

		const tasks: string[] = [];
		flags.forEach((target: string) => {
			const targetTsconfig = _.cloneDeep(tsconfig);
			let tsconfigFileName = 'tsconfig.json';

			tasks.push(`ts:${target}`);
			// dev task cannot be configured outside of projects tsconfig
			if (target !== 'dev') {
				const targetDefaultOptions = defaultOptions[target] || {};
				const targetTsOptions = tsOptions[target] || {};

				_.merge(targetTsconfig, targetDefaultOptions, targetTsOptions);
				tsconfigFileName = `.tsconfig${target}.json`;

				grunt.file.write(tsconfigFileName, JSON.stringify(targetTsconfig));
				grunt.config.set(`clean.${target}Tsconfig`, { src: tsconfigFileName});

				tasks.push(`clean:${target}Tsconfig`);
			}
			grunt.config.set(`ts.${target}`, { tsconfig: { passThrough: true, tsconfig: tsconfigFileName }});
		});
		grunt.task.run(tasks);
	});
};
