export = function(grunt: IGrunt, packageJson: any) {
	const execa = require('execa');
	const npmBin = 'npm';
	const gitBin = 'git';
	const temp = 'temp/';
	const preReleaseTags = ['alpha', 'beta', 'rc'];

	const releaseVersion = grunt.option<string>('release-version');
	const nextVersion = grunt.option<string>('next-version');
	const preReleaseTag = grunt.option<string>('pre-release-tag');
	const dryRun = grunt.option<boolean>('dry-run');
	const tag = grunt.option<string>('tag');

	const initialPackageJson = grunt.file.readJSON(process.cwd() + '/package.json');
	const commitMsg = '"Update package metadata"';

	function matchesPreReleaseTag(preReleaseTag: string, version: string): string[] {
		const regexp = new RegExp(`(.*)-(${preReleaseTag})\\.(\\d+)`);
		return regexp.exec(version);
	}

	function matchesVersion(version1: string, version2: string): boolean {
		return version2.indexOf(version1) === 0;
	}

	function getNextPreReleaseTagVersion(versionInPackage: string, existingVersions: string[]): string {
		const filteredVersions = existingVersions
			.filter((v) => matchesVersion(versionInPackage, v))
			.filter((v) => matchesPreReleaseTag(preReleaseTag, v))
			.map((v) => parseInt(matchesPreReleaseTag(preReleaseTag, v)[3], 10));

		const nextVersion = filteredVersions.length ? Math.max(...filteredVersions) + 1 : 1;
		return `${versionInPackage}-${preReleaseTag}.${nextVersion}`;
	}

	function preparePackageJson(packageJson: any): any {
		packageJson.private = undefined;
		packageJson.scripts = undefined;
		packageJson.files = undefined;
		packageJson.typings = undefined;
		packageJson.main = 'main.js';
		return packageJson;
	}

	function command(path: string, args: string[], options: any, executeOnDryRun?: boolean): Promise<any> {
		if (dryRun && !executeOnDryRun) {
			grunt.log.subhead('dry-run (not running)');
		}
		grunt.log.ok(`path: ${path}`);
		grunt.log.ok(`args: ${args}`);
		grunt.log.ok(`options: ${JSON.stringify(options)}`);

		path = `${path} ${args.join(' ')}`;

		if (!dryRun || executeOnDryRun) {
			return execa.shell(path, args, options);
		}
		return Promise.resolve({});
	}

	grunt.registerTask('can-publish-check', 'check whether author can publish', function () {
		const done = this.async();
		const whoamiPromise = command(npmBin, ['whoami'], {}, true).then(
			(result: any) => result.stdout,
			(err: any) => grunt.fail.fatal('not logged into npm')
		);
		const maintainersPromise = command(npmBin, ['view', '.', '--json'], {}, true)
			.then((result: any) => <string[]> JSON.parse(result.stdout).maintainers)
			.then((maintainers: string[]) => maintainers.map((maintainer) => maintainer.replace(/\s<.*/, '')));

		return Promise.all([whoamiPromise, maintainersPromise]).then((results) => {
			const user = results[0];
			const maintainers = results[1];
			const isMaintainer = maintainers.indexOf(user) === 0;
			if (!isMaintainer) {
				grunt.fail.fatal(`cannot publish this package with user ${user}`);
			}
		}).then(done);
	});

	grunt.registerTask('release-publish', 'publish the package to npm', function () {
		const done = this.async();
		const args = ['publish', '.'];
		if (tag) {
			args.push('--tag', tag);
		}
		grunt.log.subhead('publishing to npm...');
		if (dryRun) {
			command(npmBin, ['pack', temp], {}, true).then(done);
		} else {
			command(npmBin, args, { cwd: temp }, false).then(done);
		}
	});

	grunt.registerTask('release-version-pre-release-tag', 'auto version based on pre release tag', function () {
		const done = this.async();
		const versionInPackage = initialPackageJson.version.replace(/-.*/g, '');
		command(npmBin, ['view', '.', '--json'], {}, true).then((result: any) => {
			if (result.stdout) {
				const versions = <string[]> JSON.parse(result.stdout).versions;
				const versionToRelease = getNextPreReleaseTagVersion(versionInPackage, versions);
				const args = ['version', versionToRelease];

				if (dryRun) {
					args.unshift('--no-git-tag-version');
				}

				grunt.log.subhead(`version to release: ${versionToRelease}`);
				return command(npmBin, args, {}, true).then(done);
			} else {
				grunt.fail.fatal('failed to fetch versions from npm');
			}
		});
	});

	grunt.registerTask('release-version-specific', 'set the version manually', function () {
		const done = this.async();
		const args = ['version', releaseVersion];
		if (dryRun) {
			args.unshift('--no-git-tag-version');
		}
		grunt.log.subhead(`version to release: ${releaseVersion}`);
		command(npmBin, args, {}, true).then(done);
	});

	grunt.registerTask('post-release-version', 'update the version post release', function () {
		const packageJson = Object.assign({}, initialPackageJson);
		if (nextVersion) {
			packageJson.version = nextVersion;
		}
		grunt.file.write('package.json', JSON.stringify(packageJson, null, '  '));
		grunt.log.subhead(`version of package.json to commit: ${packageJson.version}`);
		command(gitBin, ['commit', '-am', commitMsg], false);
	});

	grunt.registerTask('release-publish-flat', 'publish the flat package', function () {
		grunt.log.subhead('making flat package...');
		const pkg = grunt.file.readJSON(process.cwd() + '/package.json');
		const dist = grunt.config('copy.staticDefinitionFiles.dest');
		const tasks = ['copy:temp', 'release-publish', 'clean:temp'];

		grunt.config.merge({
			copy: { temp: { expand: true, cwd: dist, src: '**', dest: temp } },
			clean: { temp: [ temp ] }
		});

		grunt.file.write(temp + 'package.json', JSON.stringify(preparePackageJson(pkg), null, '  '));
		grunt.task.run(tasks);
	});

	grunt.registerTask('release', 'release', function () {
		const tasks = ['dist'];
		if (!dryRun) {
			tasks.unshift('can-publish-check');
		}

		if (preReleaseTag && preReleaseTags.indexOf(preReleaseTag) > -1) {
			tasks.push('release-version-pre-release-tag');
		} else if (releaseVersion && nextVersion) {
			tasks.push('release-version-specific');
		} else {
			grunt.fail.fatal('please specify --pre-release-tag or --release-version and --next-version');
		}
		tasks.push('release-publish-flat');
		tasks.push('post-release-version');
		grunt.task.run(tasks);
	});
};
