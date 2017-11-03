import * as vm from 'vm';
import { Context } from 'vm';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';

const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

let sandbox: SinonSandbox;
let internMock: any;
let requireMock: any;
let context: Context;

const loaderCode = fs.readFileSync(path.resolve(__dirname, '../../../lib/intern/internLoader.js')).toString();

registerSuite('lib/intern/internLoader', {
	beforeEach() {
		sandbox = sinon.sandbox.create();
		requireMock = sandbox.stub().callsArg(1);
		(<any> requireMock).config = sandbox.stub();

		internMock = {
			registerLoader: sandbox.stub().callsArg(0),
			loadScript: sandbox.stub().callsFake(() => {
				return Promise.resolve();
			})
		};

		context = vm.createContext({
			intern: internMock,
			require: requireMock
		});
	},
	tests: {
		'registers the intern loader'() {
			vm.runInContext(loaderCode, context);

			assert.isTrue(internMock.registerLoader.called);
		}
	}
});
