import { execSync as exec } from 'child_process';

export = function(grunt: IGrunt, packageJson: any) {
	grunt.registerTask('peerDepInstall', <any> function () {
		const peerDeps = packageJson.peerDependencies;
		let packageCmd = 'npm install';

		for (let name in peerDeps) {
			grunt.log.write(`installing peer dependency ${name} with version ${peerDeps[name]}...`);
			try {
				let cmd = `${packageCmd} ${name}@"${peerDeps[name]}" --no-save`;
				exec(cmd, { stdio: 'ignore' });
				grunt.log.ok('complete.');
			} catch (error) {
				grunt.log.verbose.error(error);
				grunt.log.error('failed.');
			}
		}
	});
};
