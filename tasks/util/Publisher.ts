import { join } from 'path';
import { existsSync } from 'fs';
import exec from './exec';
import { cp, rm } from 'shelljs';
import LogModule = grunt.log.LogModule;

export interface Options {
	branch?: Publisher['branch'];
	deployKeyTag?: Publisher['deployKeyTag'];
	encryptedDeployKey?: Publisher['encryptedDeployKey'];
	shouldPush?: Publisher['shouldPush'];
	subDirectory?: Publisher['subDirectory'];
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

export default class Publisher {
	/**
	 * The branch to publish API documents
	 */
	branch: string = 'gh-pages';

	/**
	 * The temporary directory for the local git clone
	 */
	cloneDir: string;

	log: Log = consoleLogger;

	/**
	 * The filename of the encrypted deployment file or false if one is not used
	 */
	encryptedDeployKey: string | boolean;

	/**
	 * Travis identifier used with encrypted files
	 */
	deployKeyTag?: string;

	/**
	 * If publishing should be skipped
	 */
	skipPublish: boolean = false;

	/**
	 * The directory to place API docs
	 */
	subDirectory: string = 'api';

	/**
	 * The directory where typedoc generates its docs
	 */
	generatedDocsDirectory: string;

	constructor(cloneDir: string, generatedDocsDir: string, options: Options = {}) {
		this.cloneDir = cloneDir;
		this.encryptedDeployKey = options.encryptedDeployKey || false;
		this.deployKeyTag = options.deployKeyTag;
		this.generatedDocsDirectory = generatedDocsDir;

		// optional configuration values
		options.subDirectory && (this.subDirectory = options.subDirectory);
		options.branch && (this.branch = options.branch);

		// optional method overrides
		options.shouldPush && (this.shouldPush = options.shouldPush);
	}

	/**
	 * If deploy credentials
	 * @return {boolean}
	 */
	hasDeployCredentials(): boolean {
		if (typeof this.encryptedDeployKey === 'boolean') {
			return false;
		}
		const keyFile = this.encryptedDeployKey;
		const deployKeyTag = this.deployKeyTag;
		return !!keyFile && !!deployKeyTag && existsSync(keyFile);
	}

	publish() {
		this.commit();

		if (!this.skipPublish && this.shouldPush()) {
			this.decryptDeployKey();
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
	 * @return {boolean} indicates whether doc updates should be pushed to the origin
	 */
	shouldPush() {
		const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
		return branch === 'master';
	}

	/**
	 * If configuration information exists for obtaining a deployment key and prerequisites have been met to publish
	 */
	private canPublish(): boolean {
		const skipDeploymentCredentials = this.encryptedDeployKey === false;
		return (skipDeploymentCredentials || this.hasDeployCredentials()) && this.shouldPush();
	}

	private commit() {
		const publishBranch = this.branch;
		const publishDir = this.subDirectory;

		exec(`git clone . ${ this.cloneDir }`, { silent: true });

		try {
			exec(`git checkout ${ publishBranch }`, { silent: true, cwd: this.cloneDir });
		}
		catch (error) {
			// publish branch didn't exist, so create it
			exec(`git checkout --orphan ${ publishBranch }`, { silent: true, cwd: this.cloneDir });
			exec('git rm -rf .', { silent: true, cwd: this.cloneDir });
			this.log.writeln(`Created ${publishBranch} branch`);
		}

		rm('-rf', join(this.cloneDir, publishDir));
		cp('-r', this.generatedDocsDirectory, join(this.cloneDir, publishDir));

		if (exec('git status --porcelain', { silent: true, cwd: this.cloneDir }) === '') {
			this.log.writeln('Nothing changed');
			return;
		}

		exec(`git add ${publishDir}`, { silent: true, cwd: this.cloneDir });
		exec('git commit -m "Update API docs"', { silent: true, cwd: this.cloneDir });
	}

	private decryptDeployKey() {
		const keyFile = this.encryptedDeployKey;
		const deployKeyTag = this.deployKeyTag;

		if (!keyFile || !deployKeyTag) {
			return;
		}

		exec(`openssl aes-256-cbc -K $encrypted_${ deployKeyTag }_key -iv $encrypted_${ deployKeyTag }_iv -in ${ keyFile } -out deploy_key -d`);
		exec('chmod 600 deploy_key');
	}

	/**
	 * Publish the document created by typedoc
	 */
	private push() {
		this.log.writeln('Publishing API docs');
		const publishBranch = this.branch || 'gh-pages';
		// push changes from the temporary clone to the local repo
		exec('git push', { silent: true, cwd: this.cloneDir });
		this.log.writeln(`Updated ${publishBranch} in local repo`);

		// push changes from the local repo to the origin repo
		const pushCommand = `git push origin ${publishBranch}`;
		if (this.hasDeployCredentials()) {
			exec(`ssh-agent bash -c 'ssh-add deploy_key; ${ pushCommand }'`, { silent: true });
		}
		else {
			exec(pushCommand);
		}
		this.log.writeln(`Pushed ${publishBranch} to origin`);
	}
}
