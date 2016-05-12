/* jshint node:true */

function mixin(destination, source) {
	for (var key in source) {
		destination[key] = source[key];
	}
	return destination;
}

/**
 * A work-around for grunt-ts 4.2.0-beta not handling experimentalDecorators
 * and improperly handling the source map options
 */
function getTsOptions(baseOptions, overrides) {
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
	options.inlineSources = options.inlineSourceMap = options.sourceMap = false;

	options.additionalFlags = additionalFlags.join(' ');

	return options;
}

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-ts');

	var compilerOptions = grunt.config.get('tsconfig').compilerOptions;
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
				mapRoot: '../dist/_debug',
				sourceMap: true,
				inlineSourceMap: false,
				inlineSources: true
			}),
			outDir: 'dist',
			src: [ '<%= skipTests %>' ]
		}
	};
};
