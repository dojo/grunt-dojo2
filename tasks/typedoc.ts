import ITask = grunt.task.ITask;
import { config } from 'shelljs';
import exec from './util/exec';
import Publisher from './util/Publisher';

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
		const outOption = grunt.option<string>('doc-dir');
		options.out = outOption || options.out || grunt.config.get<string>('apiDocDirectory');

		// Use project-local typedoc
		const typedoc = require.resolve('typedoc/bin/typedoc');
		exec(`node "${ typedoc }" ${ typedocOptions(options).join(' ') }`);

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
