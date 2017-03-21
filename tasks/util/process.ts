import { execSync, spawnSync } from 'child_process';

function applyOptions(options: any = {}) {
	options.encoding = options.encoding || 'utf8';
	options.stdio = options.stdio || (options.silent ? 'pipe' : 'inherit');
	return options;
}

export function exec(command: string, options?: any) {
	// Use execSync from child_process instead of shelljs.exec for better
	// handling of pass-through stdio
	return execSync(command, applyOptions(options));
}

export function spawn(command: string, args: string[], options?: any) {
	return spawnSync(command, args, applyOptions(options));
}
