export = function(grunt: IGrunt, packageJson: any) {
	const execa = require('execa');
	const fs = require('fs');
	const path = require('path');
	const process = require('process');
	const pkgDir = require('pkg-dir');

	grunt.registerTask('_link', '', function () {
		const done = this.async();
		const packagePath = pkgDir.sync(process.cwd());
		const targetPath = grunt.config('distDirectory');

		fs.symlink(
			path.join(packagePath, 'node_modules'),
			path.join(targetPath, 'node_modules'),
			'junction',
			() => {}
		);
		fs.symlink(
			path.join(packagePath, 'package.json'),
			path.join(targetPath, 'package.json'),
			'file',
			() => {}
		);

		execa.shell(`npm link ${targetPath}`)
			.then((result: any) => grunt.log.ok(result.stdout))
			.then(done);
	});

	grunt.registerTask('link', 'link', function () {
		const targetPath = grunt.config('distDirectory');
		const dirExists = grunt.file.isDir(targetPath);
		const tasks = ['_link'];
		if (!dirExists) {
			tasks.unshift('dist');
		}
		grunt.task.run(tasks);
	});
};
