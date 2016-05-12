export = function (grunt: IGrunt) {
	grunt.loadNpmTasks('grunt-text-replace');

	return {
		addIstanbulIgnore: {
			src: [ '<%= devDirectory %>/**/*.js' ],
			overwrite: true,
			replacements: [
				{
					from: /^(var __(?:extends|decorate|param) = )/gm,
					to: '$1/* istanbul ignore next */ '
				},
				{
					from: /^(\()(function \(deps, )/m,
					to: '$1/* istanbul ignore next */ $2'
				}
			]
		}
	};
};
