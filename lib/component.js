var path = require('path');

/**
 * 读取json内容，加一个统一的错误处理
 * @param {String} content
 * @param {String} path
 * @returns {*}
 */
function readJSON(content, path) {
	try {
		return JSON.parse(content);
	} catch (e) {
		fis.log.error('invalid json file [' + path + '] : ' + e.message);
	}
}

/**
 * 为component_modules目录下的模块建立别名
 * @param {fis.file.File} componentFile 模块的component.json文件对象

 */
function makeComponentModulesAlias(componentFile) {

	//必须存在这个文件
	if (componentFile && componentFile.exists()) {

		var json = readJSON(componentFile.getContent(), componentFile.subpath);
		//遍历component.json中的dependencies字段
		fis.util.map(json.dependencies, function(name, version) {
			// if (/^\d\./.test(version)) {
				//获取模块名，处理路径分隔符
				var module_name = name.split('/').join('-');
				//根据版本号找到模块目录
				// var dirname = '/component_modules/' + module_name + '/' + version + '/';
				//找到模块目录
				var dirname = (fis.config.get('component_modules.dir') || '/component_modules') + '/' + module_name + '/';

				//获取模块的component.json文件
				var file = componentFile = toFile(dirname + 'component.json');


				//记录alias，默认跟模块名一致
				var alias = name;
				var mainJsFile;
				//有component.js
				if (file) {
					//读取当前模块的component.json文件，解析内容
					var json = readJSON(file.getContent(), file.subpath);
					//如果定义了name字段，就用name字段作为alias
					alias = json.name || alias;

					//首先查询component main
					if (json.main) {
						if (file = toFile(dirname + json.main)) {
							mainJsFile = file;
						} else {
							fis.log.error('missing main file [' + json.main + '] of module [' + name + ']');
						}
						//然后看看有没有 index.js
					} else if (file = toFile(dirname + 'index.js')) {
						mainJsFile = file;
						//之后index.css
					} else if (file = toFile(dirname + 'index.css')) {
						mainJsFile = file;
					} else {
						//之后使用 component script
						if (json.scripts && json.scripts.length === 1) {
							if (file = toFile(dirname + json.scripts[0])) {
								mainJsFile = file;
							}
							//然后使用 styles
						} else if (json.styles && json.styles.length === 1) {
							if (file = toFile(dirname + json.styles[0])) {
								mainJsFile = file;
							}
						} else {
							fis.log.error('can`t find module [' + name + '@' + version + '] main file');
						}
					}
					//没有component.json 则使用index.js
				} else if (file = toFile(dirname + 'index.js')) {
					mainJsFile = file;
					//模块同名module_name.js
				} else if (file = toFile(dirname + module_name + '.js')) {
					mainJsFile = file;
					// index.css
				} else if (file = toFile(dirname + 'index.css')) {
					mainJsFile = file;
					//模块同名module_name.css
				} else if (file = toFile(dirname + module_name + '.css')) {
					mainJsFile = file;
				} else {
					fis.log.error('can`t find module [' + name + '@' + version + '] in [/component.json]');
				}

				// map.alias[alias] = mainJsFile.getId();
				makeFileId(mainJsFile.subpath, alias);
				// 迭代依赖
				makeComponentModulesAlias(componentFile);
			// } else {
			// 	fis.log.error('invalid version [' + version + '] of component [' + name + ']');
			// }
		});
	}
}

module.exports = function() {
    var componentJsonDir = '/';
    if (fis.config.get('component_modules.dir')) {
        componentJsonDir = path.join(fis.config.get('component_modules.dir'), '../');
    }

	makeComponentModulesAlias(toFile(componentJsonDir + 'component.json'));

};

var path = require('path');
var toFile = function(subpath){
	var root = fis.project.getProjectPath();
	var absolutePath = path.join(root, subpath);
	return fis.file(absolutePath);
}
var makeFileId = function(subpath, id) {
	var path = 'path';
	var map = fis.config.get('roadmap.' + path, []);
	for (var i = 0, len = map.length; i < len; i++) {
		var opt = map[i],
			reg = opt.reg;
		if (reg) {
			//reg可以是字符串
			if (typeof reg === 'string') {
				//replaceDefine，例如替换reg里面用到的{$namespace}
				reg = fis.util.glob(fis.uri.replaceDefine(reg, true));
			} else if (!fis.util.is(reg, 'RegExp')) {
				fis.log.error('invalid regexp [' + reg + '] of [roadmap.' + path + '.' + i + ']');
			}
			var matches = subpath.match(reg);
			if (matches) {

				var obj = {};
				fis.uri.replaceProperties(opt, matches, obj);
				fis.util.merge(obj, {
					reg: subpath,
					id: id
				});
				map.unshift(obj);
				break;
			}
		} else {
			//如果没有填写reg属性会报错
			fis.log.error('[roadmap.' + path + '.' + i + '] missing property [reg].');
		}
	}
	return false;
}
