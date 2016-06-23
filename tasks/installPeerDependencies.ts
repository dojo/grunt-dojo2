import { execSync as exec } from 'child_process';

export = function(grunt: IGrunt, packageJson: any) {
	grunt.registerTask('peerDepInstall', <any> function () {
		const peerDeps = packageJson.peerDependencies;

		for (let name in peerDeps) {
			grunt.log.write(`installing peer dependency ${name} with version ${peerDeps[name]}...`);
			try {
				let cmd = `npm install ${name}@"${peerDeps[name]}"`;
				exec(cmd, { stdio: 'ignore' });
				grunt.log.ok('complete.');
			} catch (error) {
				grunt.log.error('failed.');
			}
		}
	});
};
