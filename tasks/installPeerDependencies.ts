import { execSync as exec } from 'child_process';

export = function(grunt: IGrunt, packageJson: any) {
	grunt.registerTask('peerDepInstall', <any>function() {
		const peerDeps = packageJson.peerDependencies;
		let packageCmd = 'npm install';
		let message = '';
		let peerDepsFound = false;

		for (let name in peerDeps) {
			packageCmd = `${packageCmd} ${name}@"${peerDeps[name]}"`;
			message = `${message}installing peer dependency ${name} with version ${peerDeps[name]}\n`;
			peerDepsFound = true;
		}
		if (peerDepsFound) {
			packageCmd = `${packageCmd} --no-save`;
			grunt.log.write(message);
			try {
				exec(packageCmd, { stdio: 'ignore' });
				grunt.log.ok('complete.');
			} catch (error) {
				grunt.log.verbose.error(error);
				grunt.log.error('failed.');
			}
		} else {
			grunt.log.write('No peer dependencies detected.');
		}
	});
};
