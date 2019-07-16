"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const path = require("path");
const build_1 = require("./build");
/**
 * 编译APP
 * @param appPath 工程目录
 * @param param1 参数信息
 */
exports.build = (appPath, config) => {
    const build = new build_1.default(appPath, config);
    // build.start()
    const watcher = chokidar.watch(path.join(appPath, 'www'), {
        ignored: /(^|[/\\])\../,
        persistent: true,
        ignoreInitial: true
    });
    // Something to use when events are received.
    const log = console.log.bind(console);
    // Add event listeners.
    watcher
        .on('add', path => log(`File ${path} has been added`))
        .on('change', path => log(`File ${path} has been changed`))
        .on('unlink', path => log(`File ${path} has been removed`));
    // More possible events.
    watcher
        .on('addDir', path => log(`Directory ${path} has been added`))
        .on('unlinkDir', path => log(`Directory ${path} has been removed`))
        .on('error', error => log(`Watcher error: ${error}`))
        .on('ready', () => log('Initial scan complete. Ready for changes'))
        .on('raw', (event, path, details) => {
        // internal
        log('Raw event info:', event, path, details);
    });
};
