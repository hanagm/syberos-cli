"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
function build(appPath, buildConfig) {
    const { type, debug, port } = buildConfig;
    switch (type) {
        case "device" /* DEVICE */:
            buildForDevice(appPath, { debug, port });
            break;
        case "simulator" /* SIMULATOR */:
            buildForSimulator(appPath, { debug });
            break;
        default:
            console.log(chalk_1.default.red('输入类型错误，目前只支持 device(真机)/simulator类型'));
    }
}
exports.default = build;
function buildForDevice(appPath, { debug }) {
    require('./build').build(appPath, {
        debug,
        adapter: "device" /* DEVICE */
    });
}
function buildForSimulator(appPath, { debug }) {
    require('./build').build(appPath, {
        debug,
        adapter: "simulator" /* SIMULATOR */
    });
}
