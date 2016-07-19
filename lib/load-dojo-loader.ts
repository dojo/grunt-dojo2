import { join } from 'path';

const resolveFrom = require('resolve-from');

export default function loadDojoLoader ({ peerDependencies = {} }: any) {
	const baseUrl = process.cwd();
	const packages = [
		{ name: 'src', location: '_build/src' }
	];

	for (const name in peerDependencies) {
		if (/^dojo-/.test(name)) {
			packages.push({ name, location: join('node_modules', name, 'dist', 'umd') });
		}
		else if (name === '@reactivex/rxjs') {
			packages.push({ name: 'rxjs', location: join('node_modules', name, 'dist', 'amd') });
		}
		else if (name === 'maquette' || name === 'immutable') {
			packages.push({ name, location: join('node_modules', name, 'dist') });
		}
		else {
			packages.push({ name, location: join('node_modules', name) });
		}
	}

	// Assume dojo-loader is installed in the parent project.
	const r = require(resolveFrom(baseUrl, 'dojo-loader'));
	r.config({
		baseUrl,
		packages
	});

	return {
		baseUrl,
		packages,
		require: r
	};
}
