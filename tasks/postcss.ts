export = function(grunt: IGrunt) {
	const path = require('path');
	const fs = require('fs');
	const postCssImport = require('postcss-import');
	const postCssNext = require('postcss-cssnext');
	const postCssModules = require('postcss-modules');

	grunt.loadNpmTasks('grunt-postcss');

	const distDirectory = grunt.config.get<string>('distDirectory');

	const cssModuleProcessor = postCssModules({
		generateScopedName: '[name]__[local]__[hash:base64:5]',
		getJSON: function(cssFileName: string, json: JSON) {
			const outputPath = path.resolve(distDirectory, path.relative('src', cssFileName));
			fs.writeFileSync(outputPath + '.json', JSON.stringify(json));
		}
	});

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
		cssModuleProcessor
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
		src: '**/*.css',
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
			processors: moduleProcessors
		},
		variables: {
			filed: variableFiles,
			processors: variablesProcessors
		}
	});
};
