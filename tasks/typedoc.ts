import ITask = grunt.task.ITask;
import { config, touch } from 'shelljs';
import exec from './util/exec';
import Publisher from './util/Publisher';
import { join } from 'path';

/**
 * Build command line arguments for typedoc from grunt options
 * @param options grunt options
 * @return {string[]} command line arguments array
 */
function typedocOptions(options: any) {
	const args: string[] = [];
	Object.keys(options).filter(key => {
		return key !== 'publishOptions';
	}).forEach(key => {
		if (options[key]) {
			args.push(`--${key}`);

			if (typeof options[key] !== 'boolean') {
				args.push(`"${options[key]}"`);
			}
		}
	});
	return args;
}

export = function (grunt: IGrunt) {
	grunt.registerTask('typedoc', function (this: ITask) {
		const deploy = process.env.DEPLOY_DOCS;
		const shouldPublish = deploy === 'publish' || deploy === 'commit';

		// Throw when any shelljs command fails
		config.fatal = true;

		const options: any = this.options({});
		const rootApiDocDirectory = grunt.config.get<string>('apiDocDirectory');
		const outOption = grunt.option<string>('doc-dir');
		options.out = outOption || options.out || rootApiDocDirectory;

		// Use project-local typedoc
		const typedoc = require.resolve('typedoc/bin/typedoc');
		exec(`node "${ typedoc }" ${ typedocOptions(options).join(' ') }`);

		// Add a .nojekyll file to prevent GitHub pages from trying to parse files starting with an underscore
		// @see https://github.com/blog/572-bypassing-jekyll-on-github-pages
		grunt.log.writeln(`writing .nojekyll file to ${ rootApiDocDirectory }`);
		touch(join(rootApiDocDirectory, '.nojekyll'));

		if (shouldPublish) {
			const cloneDir = grunt.config.get<string>('apiPubDirectory');
			const publishOptions = Object.assign({
				log: grunt.log,
				skipPublish: (deploy !== 'publish')
			}, options.publishOptions || {});
			const publisher = new Publisher(cloneDir, options.out, publishOptions);
			publisher.publish();
		}
	});
};
