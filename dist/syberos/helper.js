"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const constants_1 = require("../util/constants");
const index_1 = require("../util/index");
const shelljs = require("shelljs");
/**
 *  读取project.config.json配置文件
 * @param appPath
 * @return project.config.json
 */
exports.getProjectConfig = (appPath) => {
    try {
        return fs.readJSONSync(path.join(appPath, constants_1.PROJECT_CONFIG));
    }
    catch (error) {
        console.error('读取配置文件失败', JSON.stringify(error));
        throw new Error(`${constants_1.PROJECT_CONFIG} 不存在`);
    }
};
/**
 * 获取项目名称
 * @param appPath
 * @return string
 */
exports.getProjectName = (appPath) => {
    const { projectName } = exports.getProjectConfig(appPath);
    return projectName;
};
/**
 * 获取ProjectConfig 配置文件中的target
 * @param appPath
 * @param targetName
 * @return string 返回target name
 *
 */
exports.getTargetName = (appPath, adapter) => {
    if (adapter === "simulator" /* SIMULATOR */) {
        const projectConfig = exports.getProjectConfig(appPath);
        return projectConfig.targetSimulator;
    }
    if (adapter === "device" /* DEVICE */) {
        const projectConfig = exports.getProjectConfig(appPath);
        return projectConfig['target'];
    }
    throw new Error(`${constants_1.PROJECT_CONFIG} 配置文件未找到`);
};
/**
 * 主进程休眠
 * @param ms 休眠时长（毫秒）
 */
exports.sleep = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1);
            }
            catch (e) {
                reject(e);
            }
        }, ms);
    });
};
/**
 * 获取当前用户home目录下的子目录的路径
 * @param subDirs home目录下的子目录名
 */
exports.homeSubPath = (...subDirs) => {
    const { stdout } = shelljs.exec(`env | grep ^HOME= | cut -c 6-`);
    const subDirPath = path.join(stdout.trim(), ...subDirs);
    const existe = fs.pathExists(subDirPath);
    if (!existe) {
        throw new Error(`根目录下未找到${path.join(...subDirs)}目录`);
    }
    return subDirPath;
};
/**
 * 查找sh脚本路径
 * @param shFilename sh脚本文件吗
 */
exports.locateScripts = (shFilename) => {
    return path.join(index_1.getRootPath(), 'scripts', shFilename);
};
