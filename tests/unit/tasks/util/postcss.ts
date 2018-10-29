const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import { stub } from 'sinon';
import { unloadTasks, loadModule } from '../../util';

let postCssUtil: any;
const cssNanoModuleStub = stub();
const postCssModulesStub = stub();
const postCssImportStub = stub();
const postCssNextStub = stub();
const resolveStub = stub().returns('');
const relativeStub = stub().returns('');
const basenameStub = stub().returns('');
const parseStub = stub().returns('');
const dirnameStub = stub().returns('');
const joinStub = stub().returns('');
const umdWrapperStub = stub().returns('');
const packageJsonStub = stub().returns({ name: '@owner/widgets' });
const writeFileStub = stub();

registerSuite('tasks/util/postcss', {
	before() {
		const mocks = {
			cssnano: cssNanoModuleStub,
			'postcss-modules': postCssModulesStub,
			'postcss-import': postCssImportStub,
			'postcss-cssnext': postCssNextStub,
			path: {
				resolve: resolveStub,
				relative: relativeStub,
				basename: basenameStub,
				parse: parseStub,
				dirname: dirnameStub,
				join: joinStub
			},
			'./umdWrapper': umdWrapperStub,
			fs: {
				writeFileSync: writeFileStub
			}
		};

		postCssUtil = loadModule('../../../../tasks/util/postcss', require, mocks, false);
	},

	beforeEach() {
		cssNanoModuleStub.reset();
		postCssModulesStub.reset();
		postCssImportStub.reset();
		postCssNextStub.reset();
		resolveStub.reset();
		relativeStub.reset();
		basenameStub.reset();
		joinStub.reset();
		writeFileStub.reset();
		umdWrapperStub.reset();
		parseStub.reset();
		dirnameStub.reset();
		packageJsonStub.reset();
	},

	after() {
		unloadTasks();
	},

	tests: {
		createProcessors: {
			order() {
				const processors = postCssUtil.createProcessors({
					packageJson: packageJsonStub(),
					dest: ''
				});

				assert.equal(processors.length, 4);
				assert.equal(processors[0], postCssImportStub);
				assert.isTrue(postCssNextStub.calledOnce);
				assert.isTrue(postCssModulesStub.calledOnce);
				assert.isTrue(cssNanoModuleStub.calledOnce);
				assert.isTrue(postCssNextStub.calledBefore(postCssModulesStub));
				assert.isTrue(postCssModulesStub.calledBefore(cssNanoModuleStub));
			},
			'auto prefixer browsers'() {
				postCssUtil.createProcessors({
					packageJson: packageJsonStub(),
					dest: '',
					cwd: ''
				});
				assert.isTrue(postCssNextStub.calledOnce);
				const [autoPrefixrConfig] = postCssNextStub.firstCall.args;

				assert.deepEqual(autoPrefixrConfig, {
					features: {
						autoprefixer: {
							browsers: ['last 2 versions', 'ie >= 11']
						}
					}
				});

				assert.isTrue(cssNanoModuleStub.calledOnce);
				assert.deepEqual(cssNanoModuleStub.firstCall.args[0], {
					autoprefixer: false,
					zindex: false,
					reduceIdents: false,
					urlOptimize: false
				});
			},
			'generate scoped name': {
				'generate localised scoped name for dev'() {
					postCssUtil.createProcessors({
						packageJson: packageJsonStub(),
						dest: '',
						cwd: '',
						dist: false
					});
					const [{ generateScopedName }] = postCssModulesStub.firstCall.args;
					assert.equal(generateScopedName, '[name]__[local]__[hash:base64:5]');
				},
				'generate hash only scoped name for dist'() {
					postCssUtil.createProcessors({
						packageJson: packageJsonStub(),
						dest: '',
						cwd: '',
						dist: true
					});
					const [{ generateScopedName }] = postCssModulesStub.firstCall.args;
					assert.equal(generateScopedName, '[hash:base64:8]');
				}
			},
			getJSON: {
				'should create output file with .js extension'() {
					const cssFileName = 'testFileName.m.css';
					const jsonParam = {};

					resolveStub.returns(cssFileName);
					postCssUtil.createProcessors({
						packageJson: packageJsonStub(),
						dest: '',
						cwd: ''
					});

					const getJSON = (<any>postCssModulesStub.firstCall.args[0]).getJSON;
					getJSON(cssFileName, jsonParam);

					assert.isTrue(writeFileStub.calledOnce);
					assert.equal(writeFileStub.firstCall.args[0], cssFileName + '.js');
				},
				'should call basename to remove with `.m.css`'() {
					const cssFileName = 'testFileName.m.css';
					const jsonParam = {};

					resolveStub.returns(cssFileName);
					postCssUtil.createProcessors({
						packageJson: packageJsonStub(),
						dest: '',
						cwd: ''
					});

					const getJSON = (<any>postCssModulesStub.firstCall.args[0]).getJSON;

					getJSON(cssFileName, jsonParam);
					assert.isTrue(basenameStub.calledOnce);
					assert.equal(basenameStub.firstCall.args[1], '.m.css');
				},
				'should call umdWrapper with the package name in the `_key` value'() {
					const cssFileName = 'testFileName.m.css';
					const jsonParam = {};

					basenameStub.returns(cssFileName.replace('.m.css', ''));
					postCssUtil.createProcessors({
						packageJson: packageJsonStub(),
						dest: '',
						cwd: ''
					});

					const getJSON = (<any>postCssModulesStub.firstCall.args[0]).getJSON;

					getJSON(cssFileName, jsonParam);
					assert.isTrue(umdWrapperStub.calledOnce);

					assert.equal(packageJsonStub.callCount, 1, 'package.json is accessed');

					const expected = {
						' _key': '@owner/widgets/testFileName'
					};

					assert.equal(umdWrapperStub.firstCall.args[0], JSON.stringify(expected));
				}
			}
		}
	}
});
