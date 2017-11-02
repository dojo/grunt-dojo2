const path = require('path');
const fs = require('fs');
const cssNano = require('cssnano');
const postCssImport = require('postcss-import');
const postCssNext = require('postcss-cssnext');
const postCssModules = require('postcss-modules');
const umdWrapper = require('./umdWrapper');

export function createProcessors(dest: string, cwd = '', dist?: boolean) {
	return [
		postCssImport,
		postCssNext({
			features: {
				autoprefixer: {
					browsers: [
						'last 2 versions',
						'ie >= 11'
					]
				}
			}
		}),
		postCssModules({
			generateScopedName: dist ? '[hash:base64:8]' : '[name]__[local]__[hash:base64:5]',
			getJSON: function(cssFileName: string, json: any) {
				const outputPath = path.resolve(dest, path.relative(cwd, cssFileName));
				const newFilePath = outputPath + '.js';
				const themeKey = ' _key';
				json[themeKey] = 'dojo-' + path.basename(outputPath, '.m.css');
				fs.writeFileSync(newFilePath, umdWrapper(JSON.stringify(json)));
			}
		}),
		// autoprefixer included in cssnext
		cssNano({ autoprefixer: false })
	];
};
