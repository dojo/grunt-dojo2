const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

const umdWrapper = require('../../../../tasks/util/umdWrapper');

registerSuite('tasks/util/umdWrapper', {
	construct() {
		// Make sure nothing blows up.
		const wrapped = umdWrapper(JSON.stringify({}));
		assert.isNotNull(wrapped);
	}
});
