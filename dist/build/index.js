"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_1 = require("./build");
/**
 * 编译APP
 * @param appPath 工程目录
 * @param param1 参数信息
 */
exports.build = (appPath, config) => {
    const build = new build_1.default(appPath, config);
    build.start();
};
