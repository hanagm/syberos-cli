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
const chalk_1 = require("chalk");
const helper = require("../syberos/helper");
const index_1 = require("../config/index");
class Build {
    constructor(appPath, config) {
        this.conf = {};
        this.appPath = appPath;
        this.conf = Object.assign({}, this.conf, config);
        this.pdkRootPath = this.pdkPath();
        this.targetName = helper.getTargetName(this.appPath, this.conf.adapter);
    }
    /**
     * 开始编译
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk_1.default.green('开始编译'), this.appPath, JSON.stringify(this.conf));
            // 1、生成编译目录
            this.mkdirBuild();
            // 2、拷贝www路径到模板下
            yield this.copywww();
            // 3、执行构建命令
            yield this.executeShell();
            // 4、安装sop
            yield this.installSop();
        });
    }
    /**
     * 生成编译目录
     */
    mkdirBuild() {
        console.log(chalk_1.default.green('准备编译目录'));
        const appPath = this.appPath;
        const { adapter, debug } = this.conf;
        // 定义编译目录
        this.buildDir = `${appPath}/.build-${adapter}-${this.targetName}${debug ? '-Debug' : ''}`;
        if (!fs.pathExistsSync(this.buildDir)) {
            fs.mkdirsSync(this.buildDir);
        }
        shelljs.cd(this.buildDir);
        console.info('已创建编译目录：', this.buildDir);
    }
    /**
     * 拷贝www路径
     * @param appPath
     */
    copywww(appPath = this.appPath) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk_1.default.green('准备拷贝www目录'));
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
            console.log(chalk_1.default.green('准备执行编译指令'));
            // kchroot qmake
            this.execKchroot(this.qmakeCommand());
            // kchroot make
            this.execKchroot(this.makeCommand());
            // kchroot buildPkg
            this.execKchroot(this.buildPkgCommand());
        });
    }
    /**
     * 安装sop包
     */
    installSop() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(chalk_1.default.green('开始安装sop包...'));
            const { adapter } = this.conf;
            let ip;
            let port;
            let useSimulator = false;
            if ("device" /* DEVICE */ === adapter) {
                ip = '192.168.100.100';
                port = 22;
            }
            else if ("simulator" /* SIMULATOR */ === adapter) {
                ip = 'localhost';
                port = 5555;
                useSimulator = true;
            }
            else {
                throw new Error('adapter类型错误');
            }
            const { stdout } = shelljs.exec("ls --file-type *.sop |awk '{print i$0}' i=`pwd`'/'");
            const sopPath = stdout.trim();
            // 启动虚拟机
            if (useSimulator) {
                console.log(chalk_1.default.green('准备启动模拟器'));
                yield helper.startvm();
            }
            // 发送
            this.sendSop(ip, port, sopPath);
            // 安装
            this.sshInstallSop(ip, port, path.basename(sopPath));
            // 启动
            this.sshStartApp(ip, port);
        });
    }
    sendSop(ip, port, sopPath) {
        console.log(chalk_1.default.green('准备发送sop包'), ip, port.toString(), sopPath);
        shelljs.exec(`expect ${helper.locateScripts('scp-sop.sh')} ${ip} ${port} ${sopPath}`);
    }
    sshInstallSop(ip, port, filename) {
        console.log(chalk_1.default.green('准备安装sop包'), filename);
        const nameSplit = filename.split('-');
        shelljs.exec(`expect ${helper.locateScripts('ssh-install-sop.sh')} ${ip} ${port} ${nameSplit[0]} ${filename}`);
    }
    sshStartApp(ip, port) {
        const { sopid, projectName } = this.conf;
        console.log(chalk_1.default.green('准备启动app'), sopid + ':' + projectName + ':uiapp');
        shelljs.exec(`expect ${helper.locateScripts('ssh-start-app.sh')} ${ip} ${port} ${sopid} ${projectName}`);
    }
    execKchroot(subCommand = '') {
        const { adapter } = this.conf;
        const kchroot = this.locateKchroot();
        let cmd = '';
        if ("device" /* DEVICE */ === adapter) {
            // 真机
            cmd += `${kchroot} 'sb2 -t ${this.targetName} -R'`;
        }
        else if ("simulator" /* SIMULATOR */ === adapter) {
            // 模拟器
            cmd += `${kchroot} exec_${this.targetName}`;
        }
        else {
            throw new Error('adapter类型错误');
        }
        if (cmd) {
            if (subCommand) {
                cmd += ` '${subCommand}'`;
            }
            console.info('执行指令：', cmd);
            shelljs.exec(cmd);
        }
    }
    qmakeCommand() {
        const { debug } = this.conf;
        const qmake = this.locateQmake();
        const syberosPro = this.locateSyberosPro();
        const qmakeConfig = debug ? 'qml_debug' : 'release';
        const exConfig = Buffer.from(JSON.stringify(this.conf), 'utf8').toString('hex');
        return `${qmake} ${syberosPro} -r -spec linux-g++ CONFIG+=${qmakeConfig} EX_CONFIG=${exConfig}`;
    }
    makeCommand() {
        return '/usr/bin/make';
    }
    buildPkgCommand() {
        const syberosPro = this.locateSyberosPro();
        return `buildpkg ${syberosPro}`;
    }
    /**
     * 查找PDK路径
     */
    pdkPath() {
        return helper.homeSubPath('Syberos-Pdk');
    }
    /**
     * 查找kchroot路径
     */
    locateKchroot() {
        return path.join(this.pdkRootPath, 'sdk', 'script', 'kchroot');
    }
    /**
     * 查找qmake路径
     */
    locateQmake() {
        return path.join(this.pdkRootPath, 'targets', this.targetName, 'usr', 'lib', 'qt5', 'bin', 'qmake');
    }
    /**
     * 查找项目中的syberos.pro文件路径
     */
    locateSyberosPro() {
        return path.join(this.appPath, 'platforms', 'syberos', 'syberos.pro');
    }
}
exports.default = Build;
