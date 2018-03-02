import ITask = grunt.task.ITask;
import { config, touch, cp, rm } from 'shelljs';
import { exec } from './util/process';
import Publisher from './util/Publisher';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Build command line arguments for typedoc from grunt options
 * @param options grunt options
 * @return {string[]} command line arguments array
 */
function typedocOptions(options: any) {
	const args: string[] = [];
	Object.keys(options)
		.filter((key) => {
			return key !== 'publishOptions';
		})
		.forEach((key) => {
			if (options[key]) {
				args.push(`--${key}`);

				if (typeof options[key] !== 'boolean') {
					args.push(`"${options[key]}"`);
				}
			}
		});
	return args;
}

export = function(grunt: IGrunt) {
	grunt.registerTask('typedoc', function(this: ITask) {
		// Throw when any shelljs command fails
		config.fatal = true;

		const options: any = this.options({});
		const publishOptions = Object.assign(
			{
				log: grunt.log,
				subDirectory: ''
			},
			options.publishOptions || {}
		);
		options.out = grunt.option<string>('doc-dir') || options.out || grunt.config.get<string>('apiDocDirectory');

		// Use project-local typedoc
		const typedoc = require.resolve('typedoc/bin/typedoc');
		grunt.log.writeln(`Building API Docs to "${options.out}"`);
		exec(`node "${typedoc}" ${typedocOptions(options).join(' ')}`);

		// Publish
		const publishMode =
			typeof publishOptions.publishMode === 'function'
				? publishOptions.publishMode()
				: publishOptions.publishMode;
		if (publishMode) {
			const cloneDir = grunt.config.get<string>('apiPubDirectory');
			const publisher = new Publisher(cloneDir, publishOptions);
			publisher.init();

			const apiDocTarget = join(cloneDir, publishOptions.subDirectory);
			grunt.log.writeln(`copying ${options.out} to ${apiDocTarget}`);
			rm('-rf', apiDocTarget);
			cp('-r', options.out, apiDocTarget);

			// Add a .nojekyll file to prevent GitHub pages from trying to parse files starting with an underscore
			// @see https://github.com/blog/572-bypassing-jekyll-on-github-pages
			const nojekyll = join(cloneDir, '.nojekyll');
			if (!existsSync(nojekyll)) {
				touch(nojekyll);
			}

			if (publisher.commit()) {
				if (publishMode === 'publish') {
					publisher.publish();
				} else {
					grunt.log.writeln('Only committing -- skipping push to repo');
				}
			}
		}
	});
};
