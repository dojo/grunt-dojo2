import { join } from 'path';
import { existsSync, chmodSync } from 'fs';
import exec from './exec';
import { cp, rm } from 'shelljs';
import LogModule = grunt.log.LogModule;
import { relative } from 'path';

export interface Options {
	branch?: Publisher['branch'];
	deployKey?: Publisher['deployKey'];
	log?: Publisher['log'];
	shouldPush?: Publisher['shouldPush'];
	skipPublish?: Publisher['skipPublish'];
	subDirectory?: Publisher['subDirectory'];
	url?: Publisher['url'];
}

export interface Log {
	writeln: LogModule['writeln'];
}

const consoleLogger = {
	writeln(this: any, info: string) {
		console.log(info);
		return this;
	}
};

export function setConfig(key: string, value: string, global: boolean = false) {
	return exec(`git config ${ global ? '--global ' : '' }${ key } ${ value }`, { silent: true });
}

export default class Publisher {
	/**
	 * The branch to publish API documents
	 */
	branch: string = 'gh-pages';

	/**
	 * The temporary directory for the local git clone
	 */
	cloneDir: string;

	/**
	 * The deployment key to use
	 */
	deployKey: string | boolean = false;

	/**
	 * The directory where typedoc generates its docs
	 */
	generatedDocsDirectory: string;

	/**
	 * Logging utility
	 */
	log: Log = consoleLogger;

	/**
	 * If publishing should be skipped
	 */
	skipPublish: boolean = false;

	/**
	 * The directory to place API docs
	 */
	subDirectory: string = 'api';

	/**
	 * The repo location
	 */
	url: string;

	constructor(cloneDir: string, generatedDocsDir: string, options: Options = {}) {
		this.cloneDir = cloneDir;
		this.generatedDocsDirectory = generatedDocsDir;

		// optional configuration values
		options.branch && (this.branch = options.branch);
		options.deployKey && (this.deployKey = options.deployKey);
		options.log && (this.log = options.log);
		typeof options.skipPublish === 'boolean' && (this.skipPublish = options.skipPublish);
		options.subDirectory && (this.subDirectory = options.subDirectory);
		if (options.url) {
			this.url = options.url;
		}
		else {
			const repo = process.env.TRAVIS_REPO_SLUG || ''; // TODO look up the repo information?
			this.url = `git@github.com:${ repo }.git`;
		}

		// optional method overrides
		options.shouldPush && (this.shouldPush = options.shouldPush);
	}

	/**
	 * @return {boolean} if a deploy key exists in the file system
	 */
	hasDeployCredentials(): boolean {
		if (typeof this.deployKey === 'boolean') {
			return false;
		}
		return existsSync(this.deployKey);
	}

	/**
	 * Publish the contents of { generatedDocsDirectory } in the clone at { cloneDir } in the directory
	 * { subDirectory } and push to the { branch } branch.
	 */
	publish() {
		if (!existsSync(this.cloneDir)) {
			this.setup();
		}
		this.refreshTypeDoc();
		this.commit();

		if (!this.skipPublish && this.shouldPush()) {
			if (this.canPublish()) {
				this.push();
			}
			else {
				this.log.writeln('Push check failed -- not publishing API docs');
			}
		}
		else {
			this.log.writeln('Only committing -- skipping push to repo');
		}
	}

	/**
	 * Clone the target repository and switch to the deployment branch
	 */
	setup() {
		const publishBranch = this.branch;

		// Prerequisites for using git
		setConfig('user.name', 'Travis CI', true);
		setConfig('user.email', 'support@sitepen.com', true);

		this.log.writeln(`Cloning ${ this.url }`);
		this.execSSHAgent(`git clone ${ this.url } ${ this.cloneDir }`, { silent: true });

		try {
			exec(`git checkout ${ publishBranch }`, { silent: true, cwd: this.cloneDir });
		}
		catch (error) {
			// publish branch didn't exist, so create it
			exec(`git checkout --orphan ${ publishBranch }`, { silent: true, cwd: this.cloneDir });
			exec('git rm -rf .', { silent: true, cwd: this.cloneDir });
			this.log.writeln(`Created ${publishBranch} branch`);
		}
	}

	/**
	 * @return {boolean} indicates whether doc updates should be pushed to the origin
	 */
	shouldPush() {
		const branch = process.env.TRAVIS_BRANCH || exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
		return branch === 'master';
	}

	/**
	 * If configuration information exists for obtaining a deployment key and prerequisites have been met to publish
	 */
	private canPublish(): boolean {
		const skipDeploymentCredentials = typeof this.deployKey === 'boolean' && !this.deployKey;
		return (skipDeploymentCredentials || this.hasDeployCredentials()) && this.shouldPush();
	}

	/**
	 * Remove everything in preparation for the typedoc
	 */
	private refreshTypeDoc() {
		const publishDir = this.subDirectory;

		rm('-rf', join(this.cloneDir, publishDir));
		cp('-r', this.generatedDocsDirectory, join(this.cloneDir, publishDir));
	}

	/**
	 * Commit (but do not push) everything the new documentation
	 */
	private commit() {
		const publishDir = this.subDirectory;

		if (exec('git status --porcelain', { silent: true, cwd: this.cloneDir }) === '') {
			this.log.writeln('Nothing changed');
			return;
		}

		exec(`git add ${publishDir}`, { silent: true, cwd: this.cloneDir });
		exec('git commit -m "Update API docs"', { silent: true, cwd: this.cloneDir });
	}

	/**
	 * Execute a credentialed git command
	 * @param command the command to execute
	 * @param options execute options
	 */
	private execSSHAgent(command: string, options: any = {}): string {
		if (this.hasDeployCredentials()) {
			const deployKey: string = <string> this.deployKey;
			const relativeDeployKey = options.cwd ? relative(options.cwd, deployKey) : deployKey;
			chmodSync(deployKey, '600');
			return exec(`ssh-agent bash -c 'ssh-add ${ relativeDeployKey }; ${ command }'`, options);
		}
		else {
			return exec(command, options);
		}
	}

	/**
	 * Publish the document created by typedoc
	 */
	private push() {
		this.log.writeln('Publishing API docs');
		const publishBranch = this.branch || 'gh-pages';

		this.execSSHAgent(`git push origin ${publishBranch}`, { silent: true, cwd: this.cloneDir });
		this.log.writeln(`Pushed ${publishBranch} to origin`);
	}
}
