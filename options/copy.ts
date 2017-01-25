export = function (grunt: IGrunt) {
	const path = require('path');
	
	grunt.loadNpmTasks('grunt-contrib-copy');

	return {
		staticTestFiles: {
			expand: true,
			cwd: '.',
			src: [ '<%= staticTestFiles %>' ],
			dest: '<%= devDirectory %>'
		},
		'staticDefinitionFiles-dev': {
			expand: true,
			cwd: '.',
			src: [ path.join('src', '<%= staticDefinitionFiles %>') ],
			dest: '<%= devDirectory %>'
		},
		'staticDefinitionFiles-dist': {
			expand: true,
			cwd: 'src',
			src: [ '<%= staticDefinitionFiles %>' ],
			dest: '<%= distDirectory %>'
		}
	};
};
