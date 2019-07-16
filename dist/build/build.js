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
            console.log('开始编译：', this.appPath);
            // 1、生成编译目录
            yield this.mkdirBuild();
            // 2、拷贝www路径到模板下
            yield this.copywww();
            // 3、执行构建命令
            yield this.executeShell();
        });
    }
    /**
     * 生成编译目录
     * @param appPath 项目目录
     * @param targetName 编译的target
     */
    mkdirBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('准备编译目录');
            const appPath = this.appPath;
            const { adapter, debug } = this.conf;
            // target
            const targetName = this.getTargetName();
            const projectName = helper_1.getProjectName(appPath);
            // 定义编译目录
            const buildDir = `${appPath}/.build-${adapter}-${projectName}-${targetName}${debug ? '-Debug' : ''}`;
            yield fs.emptyDir(buildDir);
            console.info('已创建编译目录：', buildDir);
        });
    }
    /**
     * 拷贝www路径
     * @param appPath
     */
    copywww(appPath = this.appPath) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('准备拷贝www目录');
            // const projectName = getProjectName(appPath)
            const wwwPath = path.join(appPath, index_1.default.SOURCE_DIR);
            // 模板目录
            const syberosPath = path.join(appPath, 'platforms', 'syberos', 'app', 'www');
            try {
                yield fs.emptyDir(syberosPath);
                // 拷贝
                yield fs.copy(wwwPath, syberosPath);
            }
            catch (err) {
                console.error(err);
                return;
            }
            console.info('已拷贝www目录，From：', wwwPath, ' To：', syberosPath);
        });
    }
    /**
     * 执行构建脚本
     */
    executeShell() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('准备执行编译指令');
            const pdkPath = this.pdkPath();
            const targetName = this.getTargetName();
            // kchroot
            this.execKchroot(pdkPath, targetName);
            // qmake
            // this.execQmake(pdkPath, targetName)
            // // make
            // this.execMake()
            // // buildPkg
            // this.execBuildPkg()
        });
    }
    execKchroot(pdkRootPath, targetName) {
        const { adapter } = this.conf;
        const kchroot = this.locateKchroot(pdkRootPath);
        let cmd = '';
        if ("device" /* DEVICE */ === adapter) {
            // 真机
            cmd = `${kchroot} 'sb2 -t ${targetName} -R'`;
        }
        else if ("simulator" /* SIMULATOR */ === adapter) {
            // 模拟器
            cmd = `${kchroot} exec_${targetName}`;
        }
        else {
            throw new Error('adapter类型错误');
        }
        if (cmd) {
            console.info('执行指令：', cmd);
            shelljs.exec(cmd, (code, stdout, stderr) => {
            });
            // o.send(`/home/abeir/Syberos-Pdk/targets/target-armv7tnhl-xuanwu/usr/lib/qt5/bin/qmake /home/abeir/workspace/syberos/syberos-cli-test/test1/syberos.pro -r -spec linux-g++ CONFIG+=release`)
        }
    }
    execQmake(pdkRootPath, targetName, appPath = this.appPath) {
        const { debug } = this.conf;
        const qmake = this.locateQmake(pdkRootPath, targetName);
        const syberosPro = this.locateSyberosPro();
        const qmakeConfig = debug ? 'qml_debug' : 'release';
        const cmd = `${qmake} ${syberosPro} -r -spec linux-g++ CONFIG+=${qmakeConfig}`;
        console.info('执行指令：', cmd);
        shelljs.exec(cmd);
    }
    execMake(make = '/usr/bin/make') {
        console.info('执行指令：', make);
        shelljs.exec(make);
    }
    execBuildPkg() {
        const syberosPro = this.locateSyberosPro();
        const cmd = `buildpkg ${syberosPro}`;
        console.info('执行指令：', cmd);
        shelljs.exec(cmd);
    }
    /**
     * 查找PDK路径
     */
    pdkPath() {
        const { stdout } = shelljs.exec(`env | grep ^HOME= | cut -c 6-`);
        const pdkPath = path.join(stdout.trim(), 'Syberos-Pdk');
        const existe = fs.pathExists(pdkPath);
        if (!existe) {
            throw new Error('根目录下未找到Sberos-Pdk目录');
        }
        return pdkPath;
    }
    /**
     * 查找kchroot路径
     * @return {string} kchroot 路径
     */
    locateKchroot(pdkRootPath) {
        return path.join(pdkRootPath, 'sdk', 'script', 'kchroot');
    }
    /**
     * 查找qmake路径
     * @param pdkRootPath  pdk根目录
     * @param target target名称
     * @return {string} qmake 路径
     */
    locateQmake(pdkRootPath, target) {
        return path.join(pdkRootPath, 'target', target, 'usr', 'lib', 'qt5', 'bin', 'qmake');
    }
    /**
     * 查找项目中的syberos.pro文件路径
     * @param appPath 项目根目录
     * @return {string} syberos.pro文件路径
     */
    locateSyberosPro(appPath = this.appPath) {
        return path.join(appPath, 'platforms', 'syberos', 'syberos.pro');
    }
    getTargetName() {
        const { adapter, target } = this.conf;
        if (target) {
            return target;
        }
        return helper_1.getTargetName(this.appPath, adapter);
    }
}
exports.default = Build;
