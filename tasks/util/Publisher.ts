import { existsSync, chmodSync } from 'fs';
import { exec, spawn } from './process';
import LogModule = grunt.log.LogModule;
import { relative } from 'path';

export interface Options {
	branch?: Publisher['branch'];
	deployKey?: Publisher['deployKey'];
	log?: Publisher['log'];
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

export function setGlobalConfig(key: string, value: string) {
	return exec(`git config --global ${key} ${value}`, { silent: true });
}

export default class Publisher {
	/**
	 * The branch to publish
	 */
	branch: string = 'gh-pages';

	/**
	 * The temporary directory for the local git clone
	 */
	cloneDirectory: string;

	/**
	 * The deployment key to use
	 */
	deployKey: string = 'deploy_key';

	/**
	 * Logging utility
	 */
	log: Log = consoleLogger;

	/**
	 * The repo location
	 */
	url: string;

	constructor(cloneDir: string, options: Options = {}) {
		this.cloneDirectory = cloneDir;

		// optional configuration values
		options.branch && (this.branch = options.branch);
		options.deployKey && (this.deployKey = options.deployKey);
		options.log && (this.log = options.log);
		if (options.url) {
			this.url = options.url;
		} else {
			const repo = process.env.TRAVIS_REPO_SLUG || ''; // TODO look up the repo information?
			this.url = `git@github.com:${repo}.git`;
		}
	}

	/**
	 * @return {boolean} if a deploy key exists in the file system
	 */
	hasDeployCredentials(): boolean {
		return existsSync(this.deployKey);
	}

	/**
	 * Commit files to a fresh clone of the repository
	 */
	commit(): boolean {
		if (exec('git status --porcelain', { silent: true, cwd: this.cloneDirectory }) === '') {
			this.log.writeln('Nothing changed');
			return false;
		}

		exec(`git add --all .`, { silent: true, cwd: this.cloneDirectory });
		exec('git commit -m "Update API docs"', { silent: true, cwd: this.cloneDirectory });
		return true;
	}

	/**
	 * Initialize the repo and prepare for it to check in
	 */
	init() {
		const publishBranch = this.branch;

		// Prerequisites for using git
		if (!this.hasConifg('user.name')) {
			setGlobalConfig('user.name', 'Travis CI');
		}
		if (!this.hasConifg('user.email')) {
			setGlobalConfig('user.email', 'support@sitepen.com');
		}

		this.log.writeln(`Cloning ${this.url}`);
		this.execSSHAgent('git', ['clone', this.url, this.cloneDirectory], { silent: true });

		try {
			exec(`git checkout ${publishBranch}`, { silent: true, cwd: this.cloneDirectory });
		} catch (error) {
			// publish branch didn't exist, so create it
			exec(`git checkout --orphan ${publishBranch}`, { silent: true, cwd: this.cloneDirectory });
			exec('git rm -rf .', { silent: true, cwd: this.cloneDirectory });
			this.log.writeln(`Created ${publishBranch} branch`);
		}
	}

	/**
	 * Publish the contents of { sourceDirectory } in the clone at { cloneDir } in the directory
	 * { subDirectory } and push to the { branch } branch.
	 */
	publish() {
		this.log.writeln(`Publishing ${this.branch} to origin`);
		this.execSSHAgent('git', ['push', 'origin', this.branch], { silent: true, cwd: this.cloneDirectory });
		this.log.writeln(`Pushed ${this.branch} to origin`);
	}

	/**
	 * Execute a credentialed git command
	 * @param command the command to execute
	 * @param options execute options
	 */
	private execSSHAgent(command: string, args: string[], options: any): string {
		if (this.hasDeployCredentials()) {
			const deployKey: string = <string>this.deployKey;
			const relativeDeployKey = options.cwd ? relative(options.cwd, deployKey) : deployKey;
			chmodSync(deployKey, '600');
			return exec(`ssh-agent bash -c 'ssh-add ${relativeDeployKey}; ${command} ${args.join(' ')}'`, options);
		} else {
			this.log.writeln(`Deploy Key "${this.deployKey}" is not present. Using environment credentials.`);
			const response = spawn(command, args, options);

			if (response.stderr) {
				this.log.writeln(response.stderr);
			}
			return response.stdout;
		}
	}

	private hasConifg(key: string): boolean {
		try {
			return !!exec(`git config ${key}`, { silent: true });
		} catch (e) {}

		return false;
	}
}
