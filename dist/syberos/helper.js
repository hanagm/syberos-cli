"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const constants_1 = require("../util/constants");
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
