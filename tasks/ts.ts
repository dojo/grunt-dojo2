import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import ITask = grunt.task.ITask;

export = function (grunt: IGrunt) {
	const distDirectory = grunt.config.get<string>('distDirectory');
	const defaultOptions: any = {
		umd: {
			exclude: ['tests/**/*.ts', 'src/*/tests/**/*.ts', 'src/*/example/**/*.ts'],
			compilerOptions: {
				outDir: distDirectory,
				declaration: true,
				sourceMap: true,
				inlineSources: true
			}
		},
		esm: {
			exclude: ['tests/**/*.ts', 'src/*/tests/**/*.ts', 'src/*/example/**/*.ts'],
			compilerOptions: {
				target: 'es6',
				module: 'esnext',
				sourceMap: true,
				outDir: 'dist/esm',
				inlineSources: true
			}
		}
	};
	const postTasks: any = {
		esm: [
			function () {
				grunt.task.registerTask('rename-mjs', () => {
					// rename .js files to .mjs files
					grunt.file.expand(['dist/esm/**/*.js'])
						.forEach(file => fs.renameSync(file, file.replace(/\.js$/g, '.mjs')));

					// rename .js.map files to .mjs.map files
					grunt.file.expand(['dist/esm/**/*.js.map'])
						.forEach(file => fs.renameSync(file, file.replace(/\.js\.map$/g, '.mjs.map')));

					// change the .js files to .mjs files inside the map files
					grunt.file.expand(['dist/esm/**/*.mjs.map'])
						.forEach(file => {
							const json = grunt.file.readJSON(file);
							if (json.file) {
								json.file = json.file.replace(/\.js$/g, '.mjs');
							}

							grunt.file.write(file, JSON.stringify(json));
						});
				});
				return 'rename-mjs';
			}
		],
		dist: [
			function () {
				grunt.task.registerTask('merge-dist', () => {
					grunt.file.mkdir(path.resolve('dist/all'));

					grunt.file.expand(['dist/umd/**/*']).forEach((file: string) => {
						grunt.file.copy(file, file.replace('dist/umd/', 'dist/all/'));
					});

					grunt.file.expand(['dist/esm/**/*']).forEach((file: string) => {
						grunt.file.copy(file, file.replace('dist/esm/', 'dist/all/'));
					});
				});

				return 'merge-dist';
			}
		]
	};

	grunt.registerTask('dojo-ts', <any> function (this: ITask) {
		grunt.loadNpmTasks('grunt-ts');

		const flags = this.args && this.args.length ? this.args : ['dev'];
		const tsconfig = grunt.config.get<any>('tsconfig');
		const tsOptions = grunt.config.get<any>('ts') || {};
		const baseOptions = {
			failOnTypeErrors: true,
			fast: 'never'
		};

		grunt.config.set('ts.options', baseOptions);

		const tasks: string[] = [];
		flags.forEach((target: string) => {
			let tsconfigFileName = 'tsconfig.json';

			if (target !== 'dist') {
				tasks.push(`ts:${target}`);
				// dev task cannot be configured outside of projects tsconfig
				if (target !== 'dev') {
					const targetTsconfig = _.cloneDeep(tsconfig);
					const targetDefaultOptions = defaultOptions[target] || {};
					const targetTsOptions = tsOptions[target] || {};

					_.merge(targetTsconfig, targetDefaultOptions, targetTsOptions);
					tsconfigFileName = `.tsconfig${target}.json`;
					grunt.file.write(tsconfigFileName, JSON.stringify(targetTsconfig));
					grunt.config.set(`clean.${target}Tsconfig`, { src: tsconfigFileName });

					tasks.push(`clean:${target}Tsconfig`);
				}
				grunt.config.set(`ts.${target}`, { tsconfig: { passThrough: true, tsconfig: tsconfigFileName } });
			} else {
				tasks.push('dojo-ts:umd');
				tasks.push('dojo-ts:esm');
			}

			if (target in postTasks) {
				postTasks[target].forEach((task: any) => {
					tasks.push(task());
				});
			}
		});

		grunt.task.run(tasks);
	});
};
