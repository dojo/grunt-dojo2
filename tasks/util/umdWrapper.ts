export = function(content: string): string {
	return `(function (root, factory) {
if (typeof define === 'function' && define.amd) {
	define([], function () { return (factory()); });
} else if (typeof module === 'object' && module.exports) {
	module.exports = factory();
}
}(this, function () {
	return ${content};
}));`;
};
