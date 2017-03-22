import { createProcessors } from './util/postcss';

export = function init(grunt: IGrunt) {
	const path = require('path');
	const fs = require('fs');
	const postCssImport = require('postcss-import');
	const postCssNext = require('postcss-cssnext');
	grunt.loadNpmTasks('grunt-postcss');

	const distDirectory = grunt.config.get<string>('distDirectory') || '';
	const devDirectory = grunt.config.get<string>('devDirectory') || '';

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
			src: ['**/*.m.css'],
			dest: dest,
			cwd: 'src'
		}];
	}

	const variableFiles = [{
		expand: true,
		src: ['**/variables.css'],
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
				processors: createProcessors(devDirectory)
			}
		},
		'modules-dist': {
			files: moduleFiles(distDirectory),
			options: {
				processors: createProcessors(distDirectory, 'src', true)
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
