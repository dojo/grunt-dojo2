import * as nodeUtil from 'util';
import { create, ReportType } from 'istanbul-reports';
import {
	CoverageMap,
	CoverageMapData,
	createCoverageMap
} from 'istanbul-lib-coverage';
import { createContext, summarizers, Watermarks } from 'istanbul-lib-report';

import Node, { Events } from 'intern/lib/executors/Node';
import Test from 'intern/lib/Test';
import Suite from 'intern/lib/Suite';
import { CoverageProperties } from 'intern/lib/reporters/Coverage';
import Runner from 'intern/lib/reporters/Runner';
import { createEventHandler } from 'intern/lib/reporters/Reporter';

const LIGHT_RED = '\x1b[91m';
const LIGHT_GREEN = '\x1b[92m';
const LIGHT_MAGENTA = '\x1b[95m';

const eventHandler = createEventHandler<Events>();

interface ErrorObject {
	id: string;
	timeElapsed: number;
	error: string;
}

interface ReportOptions {
	filename?: string;
	directory?: string;
}

interface ReporterProperties extends CoverageProperties {
	directory?: string;
	lcovFilename?: string;
	htmlDirectory?: string;
	watermarks?: Watermarks;
}

export default class Reporter extends Runner {
	private _errors: { [sessionId: string ]: ErrorObject[] } = {};

	directory: string;
	lcovFilename: string;
	htmlDirectory: string;

	constructor(executor: Node, options: Partial<ReporterProperties> = {}) {
		super(executor, options);

		this.directory = options.directory || '.';
		this.lcovFilename = options.lcovFilename || 'coverage-final.lcov';
		this.htmlDirectory = options.htmlDirectory || 'html-report';
	}

	createCoverageReport(type: ReportType, data: CoverageMapData | CoverageMap, options: ReportOptions = {}) {
		let map: CoverageMap;

		if (isCoverageMap(data)) {
			map = data;
		} else {
			map = createCoverageMap(data);
		}

		const transformed = this.executor.sourceMapStore.transformCoverage(map);

		const context = createContext({
			dir: options.directory || this.directory,
			sourceFinder: transformed.sourceFinder,
			watermarks: this.watermarks
		});
		const tree = summarizers.pkg(transformed.map);
		const report = create(type, { file: options.filename });
		tree.visit(report, context);
	}

	@eventHandler()
	error() {
		this.hasRunErrors = true;
	}

	@eventHandler()
	runEnd() {
		let numTests = 0;
		let numPassedTests = 0;
		let numFailedTests = 0;
		let numSkippedTests = 0;

		const sessionIds = Object.keys(this.sessions);
		const numEnvironments = sessionIds.length;

		sessionIds.forEach(sessionId => {
			const session = this.sessions[sessionId];
			numTests += session.suite.numTests;
			numPassedTests += session.suite.numPassedTests;
			numFailedTests += session.suite.numFailedTests;
			numSkippedTests += session.suite.numSkippedTests;
		});

		const { charm } = this;
		charm.write('\n');

		const map = this.executor.coverageMap;

		if (map.files().length > 0) {
			charm.write('\n');
			charm.display('bright');
			charm.write('Total coverage\n');
			charm.display('reset');

			this.createCoverageReport('text', map, {});
			this.createCoverageReport('lcovonly', map, {
				filename: this.lcovFilename
			});
			this.createCoverageReport('html', map, {
				directory: this.htmlDirectory
			});
		}

		let message = `TOTAL: tested ${numEnvironments} platforms, ${numFailedTests}/${numTests} failed`;

		if (numSkippedTests) {
			message += ` (${numSkippedTests} skipped)`;
		}

		if (this.hasRunErrors) {
			message += '; fatal error occurred';
		}
		else if (this.hasSuiteErrors) {
			message += '; suite error occurred';
		}

		charm.foreground(numFailedTests > 0 || this.hasRunErrors || this.hasSuiteErrors ? 'red' : 'green');
		charm.write(message);
		charm.display('reset');
		charm.write('\n');
	}

	@eventHandler()
	suiteStart(suite: Suite): void {
		if (!suite.hasParent) {
			this.sessions[suite.sessionId || ''] = { suite: suite };
			if (suite.sessionId) {
				this.charm.write('\n');
				this.charm.write(`\n‣ Created session ${suite.name} (${suite.sessionId})\n`);
			}
		}
	}

	@eventHandler()
	suiteEnd(suite: Suite): void {
		const session = this.sessions[suite.sessionId || ''];
		if (!session) {
			if (!this.serveOnly) {
				const charm = this.charm;
				charm.display('bright');
				charm.foreground('yellow');
				charm.write(`BUG: suiteEnd was received for invalid session ${suite.sessionId}`);
				charm.display('reset');
				charm.write('\n');
			}

			return;
		}

		if (suite.error) {
			this.hasSuiteErrors = session.hasSuiteErrors = true;
		}
		else if (!suite.hasParent) {
			const session = this.sessions[suite.sessionId];
			const { charm } = this;

			if (!session.coverage) {
				charm.write('No unit test coverage for ' + suite.name);
				charm.display('reset');
				charm.write('\n');
			}

			charm.write('\n\n');

			if (this._errors[suite.sessionId]) {
				this._errors[suite.sessionId].forEach((test) => {
					charm.write(LIGHT_RED);
					charm.write('× ' + test.id);
					charm.foreground('white');
					charm.write(' (' + (test.timeElapsed / 1000) + 's)');
					charm.write('\n');
					charm.foreground('red');
					charm.write(test.error);
					charm.display('reset');
					charm.write('\n\n');
				});
			}

			if (this.executor.suites.length < 2) {
				// If there's only one suite, skip outputting how many tests failed since
				// it'll be the same as the number output in runEnd()
				return;
			}

			const name = suite.name;
			const hasError = suite.error || session.hasSuiteErrors;
			const numTests = suite.numTests;
			const numFailedTests = suite.numFailedTests;
			const numSkippedTests = suite.numSkippedTests;

			let summary = nodeUtil.format('%s: %d/%d tests failed', name, numFailedTests, numTests);
			if (numSkippedTests) {
				summary += ' (' + numSkippedTests + ' skipped)';
			}

			if (hasError) {
				summary += '; suite error occurred';
			}

			charm.write(numFailedTests || hasError > 0 ? LIGHT_RED : LIGHT_GREEN);
			charm.write(summary);
			charm.display('reset');
			charm.write('\n\n');
		}
	}

	@eventHandler()
	testEnd(test: Test) {
		const { charm } = this;
		if (test.error) {
			if (!this._errors[test.sessionId]) {
				this._errors[test.sessionId] = [];
			}

			this._errors[test.sessionId].push({
				id: test.id,
				timeElapsed: test.timeElapsed,
				error: this.executor.formatError(test.error)
			});

			charm.write(LIGHT_RED);
			charm.write('×');
		}
		else if (test.skipped) {
			charm.write(LIGHT_MAGENTA);
			charm.write('~');
		}
		else {
			charm.write(LIGHT_GREEN);
			charm.write('✓');
		}
		charm.display('reset');
	}
}

function isCoverageMap(value: any): value is CoverageMap {
	return value != null && typeof value.files === 'function';
}

intern.registerPlugin('grunt-dojo2', () => {
	intern.registerReporter('grunt-dojo2', Reporter);
	const reporters: any[] = (<any> intern)._reporters || [];

	// Intern currently initializes reporters before plugins are
	// loaded, so we need a default reporter to report errors until our
	// reporter is initialized. The default reporters have their event
	// handlers set to a noop function so they don't output anything
	// afterwards.
	reporters.forEach(reporter => {
		Object.keys(reporter._eventHandlers).forEach(key => {
			const property: string = reporter._eventHandlers[key];
			reporter[property] = () => {};
		});
	});

	(<any> intern)._reporters = [
		new Reporter(intern)
	];
});
