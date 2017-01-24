export = function(grunt: IGrunt) {
	const path = require('path');
	const fs = require('fs');
	const postCssImport = require('postcss-import');
	const postCssNext = require('postcss-cssnext');
	const postCssModules = require('postcss-modules');
	const umdWrapper = require('umd-wrapper');

	grunt.loadNpmTasks('grunt-postcss');

	const distDirectory = grunt.config.get<string>('distDirectory');

	const moduleProcessors: any = [
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
			generateScopedName: '[hash:base64:8]',
			getJSON: function(cssFileName: string, json: JSON) {
				const outputPath = path.resolve(distDirectory, path.relative('src', cssFileName));
				const newFilePath = outputPath.replace(/.css$/, '.js');
				fs.writeFileSync(newFilePath, umdWrapper(JSON.stringify(json)));
			}
		})
	];

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

	const moduleFiles = [{
		expand: true,
		src: ['**/*.css', '!**/variables.css'],
		exclude: '**/variables.css',
		dest: distDirectory,
		cwd: 'src'
	}];

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
		modules: {
			files: moduleFiles,
			options: {
				processors: moduleProcessors
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
