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
const shelljs = require("shelljs");
const helper_1 = require("../syberos/helper");
const index_1 = require("../config/index");
class Build {
    constructor(appPath, config) {
        this.conf = {};
        this.appPath = appPath;
        this.conf = Object.assign(this.conf, config);
    }
    /**
     * 开始编译
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // 1、生成编译目录
            // await this.mkdirBuild()
            // 2、拷贝www路径到模板下
            yield this.copywww();
            // 3、执行构建命令
            // this.executeShell()
        });
    }
    /**
     * 生成编译目录
     * @param appPath 项目目录
     * @param targetName 编译的target
     */
    mkdirBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            const appPath = this.appPath;
            const { adapter, target, debug } = this.conf;
            // target
            let targetName = '';
            if (!target) {
                targetName = helper_1.getTargetName(appPath, adapter);
            }
            const projectName = helper_1.getProjectName(appPath);
            // 定义编译目录
            const buildDir = `${appPath}/.build-${adapter}-${projectName}-${targetName}${debug ? '-Debug' : ''}`;
            yield fs.emptyDir(buildDir);
        });
    }
    /**
     * 拷贝www路径
     * @param appPath
     */
    copywww(appPath = this.appPath) {
        return __awaiter(this, void 0, void 0, function* () {
            // const projectName = getProjectName(appPath)
            const wwwPath = path.join(appPath, index_1.default.SOURCE_DIR);
            // 模板目录
            const syberosPath = path.join(appPath, 'platforms', 'syberos', 'app', 'www');
            console.log('--', wwwPath);
            console.log('--', syberosPath);
            try {
                yield fs.emptyDir(syberosPath);
                // 拷贝
                yield fs.copy(wwwPath, syberosPath);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    /**
     * 执行构建脚本
     */
    executeShell() {
        return __awaiter(this, void 0, void 0, function* () {
            const kchroot = yield this.locateKchroot();
            // const { target } = this.conf
            console.log('cmd', kchroot);
            // shelljs.exec(`${kchroot} 'sb2 -t ${target} -R'`, function(
            //   code,
            //   stdout,
            //   stderr
            // ) {
            //   console.log('Exit code:', code)
            //   console.log('Program output:', stdout)
            //   console.log('Program stderr:', stderr)
            //   shelljs.exec()
            // })
        });
    }
    execQmake() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * 查找PDK路径
     */
    pdkPath() {
        return __awaiter(this, void 0, void 0, function* () {
            const { stdout } = yield shelljs.exec(`env | grep ^HOME= | cut -c 6-`);
            const pdkPath = path.join(stdout.trim(), 'Syberos-Pdk');
            const existe = yield fs.pathExists(pdkPath);
            if (!existe) {
                throw new Error('根目录下未找到Sberos-Pdk目录');
            }
            return pdkPath;
        });
    }
    /**
     * 查找kchroot路径
     * @return {string} kchroot 路径
     */
    locateKchroot() {
        return __awaiter(this, void 0, void 0, function* () {
            const pdkhome = yield this.pdkPath();
            return path.join(pdkhome, 'sdk', 'script', 'kchroot');
        });
    }
}
exports.default = Build;
