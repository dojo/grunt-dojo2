import * as glob from 'glob';
import * as DtsCreator from 'typed-css-modules';
import ITask = grunt.task.ITask;
export = function(grunt: IGrunt) {
	grunt.registerTask('tcm', 'generate css modules', function (this: ITask) {
		const done = this.async();
		const creator = new DtsCreator({
			rootDir: process.cwd(),
			searchDir: 'src',
		});

		glob('src/**/*.m.css', (error: Error | null, files: string[]) => {
			if (error) {
				done(error);
				return;
			}

			Promise.all(files.map(file => creator.create(file)))
				.then(dtsFilesContents => Promise.all(
					dtsFilesContents.map(dtsFileContents => dtsFileContents.writeFile())
				))
				.then(done, done);
		});
	});
};
