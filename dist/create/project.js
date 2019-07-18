"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const chalk_1 = require("chalk");
const _ = require("lodash");
const inquirer = require("inquirer");
const semver = require("semver");
const creator_1 = require("./creator");
const util_1 = require("../util");
const config_1 = require("../config");
class Project extends creator_1.default {
    constructor(options) {
        super();
        const unSupportedVer = semver.lt(process.version, 'v7.6.0');
        if (unSupportedVer) {
            throw new Error('Node.js 版本过低，推荐升级 Node.js 至 v8.0.0+');
        }
        this.rootPath = this._rootPath;
        this.conf = Object.assign({
            typescript: false,
            projectName: '',
            projectDir: '',
            template: 'default',
            sopid: '',
            appName: ''
        }, options);
    }
    init() {
        console.log(chalk_1.default.green(`SYBEROS-CLI 即将创建一个新项目!`));
        console.log('Need help? Go and open issue: https://github.com/syberos-team/syberos-hybrid');
        console.log();
    }
    create() {
        this.ask().then(answers => {
            const date = new Date();
            //对象
            const newAnswer = {};
            for (const obj in answers) {
                const value = _.trim(answers[obj]);
                newAnswer[obj] = value;
            }
            this.conf = Object.assign(this.conf, newAnswer);
            this.conf.date = `${date.getFullYear()}-${date.getMonth() +
                1}-${date.getDate()}`;
            this.write();
        });
    }
    ask() {
        const prompts = [];
        const conf = this.conf;
        if (typeof conf.projectName !== 'string') {
            prompts.push({
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称:',
                validate(input) {
                    if (!input) {
                        return '项目名不能为空！';
                    }
                    if (fs.existsSync(input)) {
                        return '当前目录已经存在同名项目，请换一个项目名！';
                    }
                    return true;
                }
            });
        }
        else if (fs.existsSync(conf.projectName)) {
            prompts.push({
                type: 'input',
                name: 'projectName',
                message: '当前目录已经存在同名项目，请换一个项目名！',
                validate(input) {
                    if (!input) {
                        return '项目名不能为空！';
                    }
                    if (fs.existsSync(input)) {
                        return '项目名依然重复！';
                    }
                    return true;
                }
            });
        }
        if (!conf.appName) {
            prompts.push({
                type: 'input',
                name: 'appName',
                message: '请输入应用名称:',
                validate(input) {
                    if (!input) {
                        return '应用名称不能为空！';
                    }
                    return true;
                }
            });
        }
        if (!conf.sopid) {
            prompts.push({
                type: 'input',
                name: 'sopid',
                message: '请输入sopid,如【com.syber.myapp】:',
                validate(input) {
                    if (!input) {
                        return 'sopid不能为空！';
                    }
                    const re = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
                    if (re.test(input)) {
                        return 'sopid不能含有中文！';
                    }
                    return true;
                }
            });
        }
        return inquirer.prompt(prompts);
    }
    write(cb) {
        const { template } = this.conf;
        this.conf.src = config_1.default.SOURCE_DIR;
        const { createApp } = require(path.join(this.templatePath(), template, 'index.js'));
        createApp(this, this.conf, {
            shouldUseYarn: util_1.shouldUseYarn,
            shouldUseCnpm: util_1.shouldUseCnpm,
            getPkgVersion: util_1.getPkgVersion
        }, cb);
    }
}
exports.default = Project;
