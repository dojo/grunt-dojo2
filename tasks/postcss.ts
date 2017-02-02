export = function(grunt: IGrunt) {
	const path = require('path');
	const fs = require('fs');
	const postCssImport = require('postcss-import');
	const postCssNext = require('postcss-cssnext');
	const postCssModules = require('postcss-modules');
	const umdWrapper = require('./util/umdWrapper');

	grunt.loadNpmTasks('grunt-postcss');

	const distDirectory = grunt.config.get<string>('distDirectory') || '';
	const devDirectory = grunt.config.get<string>('devDirectory') || '';

	function moduleProcessors(dest: string, cwd = '') {
		const scopedName = dest === devDirectory ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:8]';
		return [
			postCssImport,
			postCssNext({
				features: {
					autoprefixer: {
						browsers: [
							'last 2 versions',
							'ie >= 10'
						]
					}
				}
			}),
			postCssModules({
				generateScopedName: scopedName,
				getJSON: function(cssFileName: string, json: any) {
					const outputPath = path.resolve(dest, path.relative(cwd, cssFileName));
					const newFilePath = outputPath.replace(/.css$/, '.js');
					const themeKey = ' _key';
					json[themeKey] = 'dojo-' + path.basename(outputPath, '.css');
					const output = {
						default: json
					};
					fs.writeFileSync(newFilePath, umdWrapper(JSON.stringify(output)));
				}
			})
		];
	}

	const variablesProcessors: any = [
		postCssImport,
		postCssNext({
			features: {
				customProperties: {
					preserve: 'computed'
				}
			}
		})
	];

	function moduleFiles(dest: string) {
		return [{
			expand: true,
			src: ['**/*.css', '!**/variables.css', '!styles/widgets.css'],
			dest: dest,
			cwd: 'src'
		}];
	}

	const variableFiles = [{
		expand: true,
		src: '**/variables.css',
		dest: distDirectory,
		cwd: 'src'
	}];

	grunt.config.set('postcss', {
		options: {
			map: true
		},
		'modules-dev': {
			files: moduleFiles(path.join(devDirectory, 'src')),
			options: {
				processors: moduleProcessors(devDirectory)
			}
		},
		'modules-dist': {
			files: moduleFiles(distDirectory),
			options: {
				processors: moduleProcessors(distDirectory, 'src')
			}
		},
		variables: {
			files: variableFiles,
			options: {
				processors: variablesProcessors
			}
		}
	});
};
