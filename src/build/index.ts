import * as fs from 'fs-extra';
import chalk from 'chalk';
import * as inquirer from 'inquirer'


import { AppBuildConfig, TARGET_NAMES, DEVICES_TYPES, TARGET_SIMULATOR_NAMES, PROJECT_CONFIG } from '../util/constants';


/**
 * 重置设备的target
 * @param device
 */
export const targetChoices = (device: DEVICES_TYPES) => {

    console.log(chalk.green(`即将重置target：[${device}]`));

    const prompts: object[] = [];
    if (device === DEVICES_TYPES.SIMULATOR) {

        // 如果为模拟器
        const targetChoices: object[] = []
        for (const dd in TARGET_SIMULATOR_NAMES) {
            targetChoices.push({
                name: dd,
                value: TARGET_SIMULATOR_NAMES[dd]
            })
        }
        prompts.push({
            type: 'list',
            name: 'targetSimulator',
            message: '请选择target',
            choices: targetChoices
        })

    }

    if (device === DEVICES_TYPES.DEVICE) {
        // 如果为模拟器
        const targetChoices: object[] = []
        for (const dd in TARGET_NAMES) {
            targetChoices.push({
                name: dd,
                value: TARGET_NAMES[dd]
            })
        }
        prompts.push({
            type: 'list',
            name: 'target',
            message: '请选择target',
            choices: targetChoices
        })

    }

    return inquirer.prompt(prompts);
}

/**
 * 生成编译目录
 * @param appPath 项目目录
 * @param targetName 编译的target
 */
export const mkdirBuild = (appPath: string, targetName: DEVICES_TYPES) => {
    // 定义编译目录
    const buildDir = `${appPath}/.build_${targetName}`;

    fs.emptyDirSync(buildDir);
}

/**
 * 检验是否需要重置target
 * @param projectConfPath project.config.json路径
 * @param program 参数
 */
export const targetCheck = (projectConfPath: string, program: any) => {
    const { type,target } = program
    try {

        // 校验是否需要重新设置target
        const projectConf = fs.readJSONSync(projectConfPath);

        console.log('projectConf', JSON.stringify(projectConf))
        // 是否需要重设target
        let reset = false;
        let targetName = target;
        // 检测是否有target
        if (target) {
            targetName = target;
            reset = true;
        }

        if (type && type === 'device' && !projectConf.target) {
            targetName = "device";
            reset = true;
        }

        if (type && type === 'simulator' && !projectConf.targetSimulator) {
            targetName = "simulator";
            reset = true;
        }
        if (reset) {
             targetChoices(targetName).then(answers=>{
                console.log('answers', answers)
                const projectConfig=fs.readJSONSync(projectConfPath);
                Object.assign(projectConfig,answers);
                //格式化重写project.config.json          
                fs.writeJSONSync(projectConfPath,projectConfig,{
                    spaces:'\t',
                    EOL:'\n'
                });
             });   
        }



    } catch (e) {
        console.error('e', e)
        throw new Error(`请检查配置文件${PROJECT_CONFIG}格式，目前非JSON格式`)
    }
}


/**
 * 编译APP
 * @param appPath 工程目录
 * @param param1 参数信息
 */
export const build = (appPath: string, { target, watch, adapter, envHasBeenSet = false, port, release }: AppBuildConfig) => {
    mkdirBuild(appPath, target)
}



