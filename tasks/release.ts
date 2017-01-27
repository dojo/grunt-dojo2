import ITask = grunt.task.ITask;

export = function(grunt: IGrunt, packageJson: any) {
	const execa = require('execa');
	const path = require('path');
	const pkgDir = require('pkg-dir');
	const parse = require('parse-git-config');

	const packagePath = pkgDir.sync(process.cwd());
	const npmBin = 'npm';
	const gitBin = 'git';
	const temp = 'temp/';
	const defaultBranch = 'master';
	const preReleaseTags = ['alpha', 'beta', 'rc'];
	const gitBaseRemote = 'git@github.com:dojo/';
	const defaultMaintainers = ['sitepen', 'dojotoolkit', 'dojo'];
	const extraToCopy = ['README.md'];

	const releaseVersion = grunt.option<string>('release-version');
	const nextVersion = grunt.option<string>('next-version');
	const preReleaseTag = grunt.option<string>('pre-release-tag');
	const dryRun = grunt.option<boolean>('dry-run');
	const tag = grunt.option<string>('tag');
	const pushBack = grunt.option<boolean>('push-back');
	const initial = grunt.option<boolean>('initial');
	const skipChecks = grunt.option<boolean>('skip-checks');

	const initialPackageJson = grunt.file.readJSON(path.join(packagePath, 'package.json'));
	const commitMsg = '"Update package metadata"';

	function matchesPreReleaseTag(preReleaseTag: string, version: string): string[] {
		const regexp = new RegExp(`(.*)-(${preReleaseTag})\\.(\\d+)`);
		return regexp.exec(version) || [];
	}

	function matchesVersion(version1: string, version2: string): boolean {
		return version2.indexOf(version1) === 0;
	}

	function getNextPreReleaseTagVersion(versionInPackage: string, existingVersions: string[]): string {
		const filteredVersions = existingVersions
			.filter((v) => matchesVersion(versionInPackage, v))
			.filter((v) => matchesPreReleaseTag(preReleaseTag, v))
			.map((v) => parseInt(matchesPreReleaseTag(preReleaseTag, v)[3], 10) || 0);

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

	function getGitRemote(): string|boolean {
		const gitConfig = parse.sync();
		const remotes = Object.keys(gitConfig)
			.filter((key) => key.indexOf('remote') === 0)
			.filter((key) => gitConfig[key].url.indexOf(gitBaseRemote) === 0)
			.map((key) => gitConfig[key].url);

		return remotes.length ? remotes[0] : false;
	}

	function npmPreReleaseVersion(versionInPackage: string, versions: string[]): Promise<any> {
		const versionToRelease = getNextPreReleaseTagVersion(versionInPackage, versions);
		const args = ['version', versionToRelease];

		if (dryRun) {
			args.unshift('--no-git-tag-version');
		}

		grunt.log.subhead(`version to release: ${versionToRelease}`);
		return command(npmBin, args, {}, true);
	}

	function command(bin: string, args: string[], options: any, executeOnDryRun?: boolean): Promise<any> {
		if (dryRun && !executeOnDryRun) {
			grunt.log.subhead('dry-run (not running)');
		}

		bin = `${bin} ${args.join(' ')}`;
		grunt.log.ok(`${bin} - ${JSON.stringify(options)}`);

		if (!dryRun || executeOnDryRun) {
			return execa.shell(bin, options);
		}
		return Promise.resolve({});
	}

	grunt.registerTask('can-publish-check', 'check whether author can publish', function (this: ITask) {
		const done = this.async();
		const whoamiPromise = command(npmBin, ['whoami'], {}, true).then(
			(result: any) => result.stdout,
			(err: any) => grunt.fail.fatal('not logged into npm')
		);
		let maintainersPromise: Promise<string[]>;
		if (initial) {
			maintainersPromise = Promise.resolve(defaultMaintainers);
		} else {
			maintainersPromise = command(npmBin, ['view', '.', '--json'], {}, true)
				.then((result: any) => <string[]> JSON.parse(result.stdout).maintainers)
				.then((maintainers: string[]) => maintainers.map((maintainer) => maintainer.replace(/\s<.*/, '')));
		}

		return Promise.all([whoamiPromise, maintainersPromise]).then((results) => {
			const user = results[0];
			const maintainers = results[1];
			const isMaintainer = maintainers.indexOf(user) > -1;
			if (!isMaintainer) {
				grunt.fail.fatal(`cannot publish this package with user ${user}`);
			}
		}).then(done);
	});

	grunt.registerTask('repo-is-clean-check', 'check whether the repo is clean', function (this: ITask) {
		const done = this.async();
		return command(gitBin, ['status', '--porcelain'], {}, true)
			.then((result: any) => {
				if (result.stdout) {
					grunt.fail.fatal('there are changes in the working tree');
				}
			})
			.then(() => command(gitBin, ['rev-parse', '--abbrev-ref', 'HEAD'], {}, true))
			.then((result: any) => {
				if (result.stdout !== defaultBranch) {
					grunt.fail.fatal(`not on ${defaultBranch} branch`);
				}
			})
			.then(done);
	});

	grunt.registerTask('release-publish', 'publish the package to npm', function (this: ITask) {
		const done = this.async();
		const args = ['publish', '.'];
		const promises = [command(npmBin, args, { cwd: temp }, false)];
		if (tag) {
			args.push('--tag', tag);
		}
		grunt.log.subhead('publishing to npm...');
		if (dryRun) {
			promises.push(command(npmBin, ['pack', '../' + temp], { cwd: 'dist' }, true));
		}
		return Promise.all(promises).then(done);
	});

	grunt.registerTask('release-version-pre-release-tag', 'auto version based on pre release tag', function (this: ITask) {
		const done = this.async();
		const versionInPackage = initialPackageJson.version.replace(/-.*/g, '');
		if (initial) {
			return npmPreReleaseVersion(versionInPackage, []).then(done);
		} else {
			return command(npmBin, ['view', '.', '--json'], {}, true).then((result: any) => {
				if (result.stdout) {
					const time = JSON.parse(result.stdout).time;
					const versions = Object.keys(time).filter((key) => {
						return ['created', 'modified'].indexOf(key) < 0;
					});
					npmPreReleaseVersion(versionInPackage, versions).then(done);
				} else {
					grunt.fail.fatal('failed to fetch versions from npm');
				}
			});
		}
	});

	grunt.registerTask('release-version-specific', 'set the version manually', function (this: ITask) {
		const done = this.async();
		const args = ['version', releaseVersion];
		if (dryRun) {
			args.unshift('--no-git-tag-version');
		}
		grunt.log.subhead(`version to release: ${releaseVersion}`);
		return command(npmBin, args, {}, true).then(done);
	});

	grunt.registerTask('post-release-version', 'update the version post release', function (this: ITask) {
		const done = this.async();
		const packageJson = Object.assign({}, initialPackageJson);
		if (nextVersion) {
			packageJson.version = nextVersion;
		}
		grunt.file.write('package.json', JSON.stringify(packageJson, null, '  ') + '\n');
		grunt.log.subhead(`version of package.json to commit: ${packageJson.version}`);
		return command(gitBin, ['commit', '-am', commitMsg], {}, false)
			.then(() => {
				if (!pushBack) {
					return;
				}
				const remote = getGitRemote();
				if (remote) {
					return command(gitBin, ['push', <string> remote, defaultBranch], {}, false)
						.then(() => command(gitBin, ['push', <string> remote, '--tags'], {}, false));
				} else {
					grunt.log.subhead('could not find remote to push back to. please push with tags back to remote');
				}
			})
			.then(() => grunt.log.subhead('release completed. please push with tags back to remote'))
			.then(done);
	});

	grunt.registerTask('release-publish-flat', 'publish the flat package', function () {
		grunt.log.subhead('making flat package...');
		const pkg = grunt.file.readJSON(path.join(packagePath, 'package.json'));
		const dist = grunt.config('copy.staticDefinitionFiles-dist.dest');
		const tasks = ['copy:temp', 'release-publish', 'clean:temp'];

		grunt.config.merge({
			copy: { temp: { expand: true, cwd: dist, src: '**', dest: temp } },
			clean: { temp: [ temp ] }
		});

		grunt.file.write(path.join(temp, 'package.json'), JSON.stringify(preparePackageJson(pkg), null, '  ') + '\n');

		extraToCopy.forEach((fileName) => {
			if (grunt.file.exists(fileName)) {
				grunt.file.copy(fileName, temp + '/' + fileName);
			}
		});
		grunt.task.run(tasks);
	});

	grunt.registerTask('release', 'release', function () {
		grunt.option('remove-links', true);
		const tasks = ['dist'];

		if (skipChecks && !dryRun) {
			grunt.fail.fatal('you can only skip-checks on a dry-run!');
		}

		if (!skipChecks) {
			tasks.unshift('can-publish-check', 'repo-is-clean-check');
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
