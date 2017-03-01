import { execSync } from 'child_process';

export default function exec(command: string, options: any = {}) {
	// Use execSync from child_process instead of shelljs.exec for better
	// handling of pass-through stdio
	options.encoding = options.encoding || 'utf8';
	options.stdio = options.stdio || (options.silent ? 'pipe' : 'inherit');
	return execSync(command, options);
}
