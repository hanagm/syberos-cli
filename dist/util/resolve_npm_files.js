"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const resolvePath = require("resolve");
const babel = require("babel-core");
const t = require("babel-types");
const babel_traverse_1 = require("babel-traverse");
const babel_generator_1 = require("babel-generator");
const index_1 = require("./index");
const constants_1 = require("./constants");
const uglify_1 = require("../config/uglify");
const npmProcess = require("./npm");
const excludeNpmPkgs = ['ReactPropTypes'];
const resolvedCache = {};
const copyedFiles = {};
function resolveNpmPkgMainPath(pkgName, isProduction, npmConfig, buildAdapter = "weapp" /* WEAPP */, root) {
    try {
        return resolvePath.sync(pkgName, { basedir: root });
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log(`缺少npm包${pkgName}，开始安装...`);
            const installOptions = {
                dev: false
            };
            if (pkgName.indexOf(npmProcess.taroPluginPrefix) >= 0) {
                installOptions.dev = true;
            }
            npmProcess.installNpmPkg(pkgName, installOptions);
            return resolveNpmPkgMainPath(pkgName, isProduction, npmConfig, buildAdapter, root);
        }
    }
}
exports.resolveNpmPkgMainPath = resolveNpmPkgMainPath;
function resolveNpmFilesPath({ pkgName, isProduction, npmConfig, buildAdapter, root, rootNpm, npmOutputDir, compileInclude = [], env, uglify, babelConfig }) {
    if (!resolvedCache[pkgName]) {
        const res = resolveNpmPkgMainPath(pkgName, isProduction, npmConfig, buildAdapter, root);
        resolvedCache[pkgName] = {
            main: res,
            files: []
        };
        resolvedCache[pkgName].files.push(res);
        recursiveRequire({
            filePath: res,
            files: resolvedCache[pkgName].files,
            isProduction,
            npmConfig,
            buildAdapter,
            rootNpm,
            npmOutputDir: npmOutputDir,
            compileInclude,
            env,
            uglify,
            babelConfig
        });
    }
    return resolvedCache[pkgName];
}
exports.resolveNpmFilesPath = resolveNpmFilesPath;
function parseAst({ ast, filePath, files, isProduction, npmConfig, rootNpm, npmOutputDir, buildAdapter, compileInclude = [], env, uglify, babelConfig }) {
    const excludeRequire = [];
    babel_traverse_1.default(ast, {
        IfStatement(astPath) {
            astPath.traverse({
                BinaryExpression(astPath) {
                    const node = astPath.node;
                    const left = node.left;
                    const right = node.right;
                    if (t.isMemberExpression(left) && t.isStringLiteral(right)) {
                        if (babel_generator_1.default(left).code === 'process.env.TARO_ENV' &&
                            node.right.value !== buildAdapter) {
                            const consequentSibling = astPath.getSibling('consequent');
                            consequentSibling.traverse({
                                CallExpression(astPath) {
                                    if (astPath.get('callee').isIdentifier({ name: 'require' })) {
                                        const arg = astPath.get('arguments')[0];
                                        if (t.isStringLiteral(arg.node)) {
                                            excludeRequire.push(arg.node.value);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            });
        },
        Program: {
            exit(astPath) {
                astPath.traverse({
                    CallExpression(astPath) {
                        const node = astPath.node;
                        const callee = node.callee;
                        if (callee.name === 'require') {
                            const args = node.arguments;
                            let requirePath = args[0].value;
                            if (excludeRequire.indexOf(requirePath) < 0) {
                                if (index_1.isQuickAppPkg(requirePath)) {
                                    return;
                                }
                                if (index_1.isNpmPkg(requirePath)) {
                                    if (excludeNpmPkgs.indexOf(requirePath) < 0) {
                                        const res = resolveNpmFilesPath({
                                            pkgName: requirePath,
                                            isProduction,
                                            npmConfig,
                                            buildAdapter,
                                            root: path.dirname(index_1.recursiveFindNodeModules(filePath)),
                                            rootNpm,
                                            npmOutputDir,
                                            compileInclude,
                                            env,
                                            uglify,
                                            babelConfig
                                        });
                                        let relativeRequirePath = index_1.promoteRelativePath(path.relative(filePath, res.main));
                                        relativeRequirePath = relativeRequirePath.replace(/node_modules/g, npmConfig.name);
                                        if (buildAdapter === "alipay" /* ALIPAY */) {
                                            relativeRequirePath = relativeRequirePath.replace(/@/g, '_');
                                        }
                                        args[0].value = relativeRequirePath;
                                    }
                                }
                                else {
                                    let realRequirePath = path.resolve(path.dirname(filePath), requirePath);
                                    const tempPathWithJS = `${realRequirePath}.js`;
                                    const tempPathWithIndexJS = `${realRequirePath}${path.sep}index.js`;
                                    if (fs.existsSync(tempPathWithJS)) {
                                        realRequirePath = tempPathWithJS;
                                        requirePath += '.js';
                                    }
                                    else if (fs.existsSync(tempPathWithIndexJS)) {
                                        realRequirePath = tempPathWithIndexJS;
                                        requirePath += '/index.js';
                                    }
                                    if (files.indexOf(realRequirePath) < 0) {
                                        files.push(realRequirePath);
                                        recursiveRequire({
                                            filePath: realRequirePath,
                                            files,
                                            isProduction,
                                            npmConfig,
                                            buildAdapter,
                                            rootNpm,
                                            npmOutputDir,
                                            compileInclude,
                                            env,
                                            uglify,
                                            babelConfig
                                        });
                                    }
                                    args[0].value = requirePath;
                                }
                            }
                        }
                    }
                });
            }
        }
    });
    return babel_generator_1.default(ast).code;
}
function recursiveRequire({ filePath, files, isProduction, npmConfig, buildAdapter, npmOutputDir, rootNpm, compileInclude = [], env, uglify, babelConfig }) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileContent = fs.readFileSync(filePath).toString();
        let outputNpmPath = filePath.replace(rootNpm, npmOutputDir).replace(/node_modules/g, npmConfig.name);
        if (buildAdapter === "alipay" /* ALIPAY */) {
            outputNpmPath = outputNpmPath.replace(/@/g, '_');
        }
        if (constants_1.REG_STYLE.test(path.basename(filePath))) {
            return;
        }
        if (constants_1.REG_FONT.test(filePath) || constants_1.REG_IMAGE.test(filePath) || constants_1.REG_MEDIA.test(filePath) || constants_1.REG_JSON.test(filePath)) {
            fs.ensureDirSync(path.dirname(outputNpmPath));
            fs.writeFileSync(outputNpmPath, fileContent);
            let modifyOutput = outputNpmPath.replace(path.dirname(rootNpm) + path.sep, '');
            modifyOutput = modifyOutput.split(path.sep).join('/');
            index_1.printLog("copy" /* COPY */, 'NPM文件', modifyOutput);
            return;
        }
        fileContent = npmCodeHack(filePath, fileContent, buildAdapter);
        try {
            const constantsReplaceList = Object.assign({
                'process.env.TARO_ENV': buildAdapter
            }, index_1.generateEnvList(env || {}));
            const ast = babel.transformFromAst(transformResult.ast, '', {
                plugins: [
                    [require('babel-plugin-transform-define').default, constantsReplaceList]
                ]
            }).ast;
            fileContent = parseAst({
                ast,
                filePath,
                files,
                isProduction,
                npmConfig,
                rootNpm,
                buildAdapter,
                compileInclude,
                npmOutputDir,
                env,
                uglify,
                babelConfig
            });
        }
        catch (err) {
            console.log(err);
        }
        if (!copyedFiles[outputNpmPath]) {
            if (compileInclude && compileInclude.length) {
                const filePathArr = filePath.split(path.sep);
                const nodeModulesIndex = filePathArr.indexOf('node_modules');
                const npmPkgName = filePathArr[nodeModulesIndex + 1];
                if (compileInclude.indexOf(npmPkgName) >= 0) {
                    const compileScriptRes = yield npmProcess.callPlugin('babel', fileContent, filePath, babelConfig, rootNpm);
                    fileContent = compileScriptRes.code;
                }
            }
            if (isProduction && buildAdapter !== "quickapp" /* QUICKAPP */) {
                const uglifyPluginConfig = uglify || { enable: true };
                if (uglifyPluginConfig.enable) {
                    const uglifyConfig = Object.assign(uglify_1.default, uglifyPluginConfig.config || {});
                    const uglifyResult = npmProcess.callPluginSync('uglifyjs', fileContent, outputNpmPath, uglifyConfig, rootNpm);
                    if (uglifyResult.error) {
                        index_1.printLog("error" /* ERROR */, '压缩错误', `文件${filePath}`);
                        console.log(uglifyResult.error);
                    }
                    else {
                        fileContent = uglifyResult.code;
                    }
                }
            }
            fs.ensureDirSync(path.dirname(outputNpmPath));
            fs.writeFileSync(outputNpmPath, fileContent);
            let modifyOutput = outputNpmPath.replace(path.dirname(rootNpm) + path.sep, '');
            modifyOutput = modifyOutput.split(path.sep).join('/');
            index_1.printLog("copy" /* COPY */, 'NPM文件', modifyOutput);
            copyedFiles[outputNpmPath] = true;
        }
    });
}
function npmCodeHack(filePath, content, buildAdapter) {
    const basename = path.basename(filePath);
    switch (basename) {
        case 'lodash.js':
        case '_global.js':
        case 'lodash.min.js':
            if (buildAdapter === "alipay" /* ALIPAY */ || buildAdapter === "swan" /* SWAN */) {
                content = content.replace(/Function\(['"]return this['"]\)\(\)/, '{}');
            }
            else {
                content = content.replace(/Function\(['"]return this['"]\)\(\)/, 'this');
            }
            break;
        case 'mobx.js':
            // 解决支付宝小程序全局window或global不存在的问题
            content = content.replace(/typeof window\s{0,}!==\s{0,}['"]undefined['"]\s{0,}\?\s{0,}window\s{0,}:\s{0,}global/, 'typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {}');
            break;
        case '_html.js':
            content = 'module.exports = false;';
            break;
        case '_microtask.js':
            content = content.replace('if(Observer)', 'if(false && Observer)');
            // IOS 1.10.2 Promise BUG
            content = content.replace('Promise && Promise.resolve', 'false && Promise && Promise.resolve');
            break;
        case '_freeGlobal.js':
            content = content.replace('module.exports = freeGlobal;', 'module.exports = freeGlobal || this || global || {};');
            break;
    }
    if (buildAdapter === "alipay" /* ALIPAY */ && content.replace(/\s\r\n/g, '').length <= 0) {
        content = '// Empty file';
    }
    return content;
}
exports.npmCodeHack = npmCodeHack;
function getResolvedCache() {
    return resolvedCache;
}
exports.getResolvedCache = getResolvedCache;
