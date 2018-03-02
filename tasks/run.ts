import loadDojoLoader from '../lib/load-dojo-loader';
import ITask = grunt.task.ITask;

export = function(grunt: IGrunt, packageJson: any) {
	grunt.registerTask('run', 'Bootstrap dojo-loader and run the given --main', function(this: ITask) {
		this.async(); // Ensure Grunt doesn't exit the process.

		const main = <string>grunt.option('main') || 'src/main';
		grunt.log.ok(main);

		const { require } = loadDojoLoader(packageJson);
		require([main]);
	});
};
