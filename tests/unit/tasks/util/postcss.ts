const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import * as mockery from 'mockery';
import { stub } from 'sinon';
import { unloadTasks, loadModule } from '../../util';

let postCssUtil: any;
const postCssModulesStub = stub();
const postCssImportStub = stub();
const postCssNextStub = stub();
const resolveStub = stub().returns('');
const relativeStub = stub().returns('');
const basenameStub = stub().returns('');
const umdWrapperStub = stub().returns('');
const writeFileStub = stub();

registerSuite('tasks/util/postcss', {

	before() {
		const mocks = {
			'postcss-modules': postCssModulesStub,
			'postcss-import': postCssImportStub,
			'postcss-cssnext': postCssNextStub,
			'path': {
				'resolve': resolveStub,
				'relative': relativeStub,
				'basename': basenameStub
			},
			'./umdWrapper': umdWrapperStub,
			'fs': {
				'writeFileSync': writeFileStub
			}
		};

		postCssUtil = loadModule('../../../../tasks/util/postcss', require, mocks, false);
	},

	beforeEach() {
		postCssModulesStub.reset();
		postCssImportStub.reset();
		postCssNextStub.reset();
		resolveStub.reset();
		relativeStub.reset();
		basenameStub.reset();
		writeFileStub.reset();
		umdWrapperStub.reset();
	},

	after() {
		unloadTasks();
	},

	tests: {
		createProcessors: {
			'order'() {
				const processors = postCssUtil.createProcessors('', '');
				assert.isTrue(processors.length === 3);
				assert.equal(processors[0], postCssImportStub);
				assert.isTrue(postCssNextStub.calledOnce);
				assert.isTrue(postCssModulesStub.calledOnce);
				assert.isTrue(postCssNextStub.calledBefore(postCssModulesStub));
			},
			'auto prefixer browsers'() {
				postCssUtil.createProcessors('', '');
				assert.isTrue(postCssNextStub.calledOnce);
				assert.isTrue(postCssNextStub.calledWithMatch({
					features: {
						autoprefixer: {
							browsers: [
								'last 2 versions',
								'ie >= 11'
							]
						}
					}
				}));
			},
			'generate scoped name': {
				'generate localised scoped name for dev'() {
					postCssUtil.createProcessors('', '', false);
					assert.isTrue(postCssModulesStub.calledWithMatch({
						generateScopedName: '[name]__[local]__[hash:base64:5]'
					}));
				},
				'generate hash only scoped name for dist'() {
					postCssUtil.createProcessors('', '', true);
					assert.isTrue(postCssModulesStub.calledWithMatch({
						generateScopedName: '[hash:base64:8]'
					}));
				}
			},
			'getJSON': {
				'should create output file with .js extension'() {
					const cssFileName = 'testFileName.m.css';
					const jsonParam = {};

					resolveStub.returns(cssFileName);
					postCssUtil.createProcessors('', '');

					const getJSON = (<any> postCssModulesStub.firstCall.args[0]).getJSON;

					getJSON(cssFileName, jsonParam);
					assert.isTrue(writeFileStub.calledOnce);
					assert.isTrue(writeFileStub.firstCall.calledWithMatch(cssFileName + '.js', {}));
				},
				'should call basename to remove with `.m.css`'() {
					const cssFileName = 'testFileName.m.css';
					const jsonParam = {};

					resolveStub.returns(cssFileName);
					postCssUtil.createProcessors('', '');

					const getJSON = (<any> postCssModulesStub.firstCall.args[0]).getJSON;

					getJSON(cssFileName, jsonParam);
					assert.isTrue(basenameStub.calledOnce);
					assert.isTrue(basenameStub.firstCall.calledWith(cssFileName, '.m.css'));
				},
				'should call umdWrapper with `dojo-filename` _key in data'() {
					const cssFileName = 'testFileName.m.css';
					const jsonParam = {};

					basenameStub.returns(cssFileName.replace('.m.css', ''));
					postCssUtil.createProcessors('', '');

					const getJSON = (<any> postCssModulesStub.firstCall.args[0]).getJSON;

					getJSON(cssFileName, jsonParam);
					assert.isTrue(umdWrapperStub.calledOnce);
					assert.isTrue(umdWrapperStub.firstCall.calledWith(JSON.stringify({ ' _key': 'dojo-testFileName' })));
				}
			}
		}
	}
});
