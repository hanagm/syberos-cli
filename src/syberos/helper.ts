import * as fs from 'fs-extra'
import * as path from 'path'
import { PROJECT_CONFIG, DEVICES_TYPES } from '../util/constants'
import { getRootPath } from '../util/index'
import * as shelljs from 'shelljs'

/**
 *  读取project.config.json配置文件
 * @param appPath
 * @return project.config.json
 */
export const getProjectConfig = (appPath: string) => {
  try {
    return fs.readJSONSync(path.join(appPath, PROJECT_CONFIG))
  } catch (error) {
    console.error('读取配置文件失败', JSON.stringify(error))
    throw new Error(`${PROJECT_CONFIG} 不存在`)
  }
}

/**
 * 获取项目名称
 * @param appPath
 * @return string
 */
export const getProjectName = (appPath: string) => {
  const { projectName } = getProjectConfig(appPath)
  return projectName
}

/**
 * 获取ProjectConfig 配置文件中的target
 * @param appPath
 * @param targetName
 * @return string 返回target name
 *
 */
export const getTargetName = (appPath: string, adapter: DEVICES_TYPES) => {
  if (adapter === DEVICES_TYPES.SIMULATOR) {
    const projectConfig = getProjectConfig(appPath)
    return projectConfig.targetSimulator
  }

  if (adapter === DEVICES_TYPES.DEVICE) {
    const projectConfig = getProjectConfig(appPath)
    return projectConfig['target']
  }

  throw new Error(`${PROJECT_CONFIG} 配置文件未找到`)
}

/**
 * 主进程休眠
 * @param ms 休眠时长（毫秒）
 */
export const sleep = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1)
      } catch (e) {
        reject(e)
      }
    }, ms)
  })
}

/**
 * 获取当前用户home目录下的子目录的路径
 * @param subDirs home目录下的子目录名
 */
export const homeSubPath = (...subDirs: string[]): string => {
  const { stdout } = shelljs.exec(`env | grep ^HOME= | cut -c 6-`)
  const subDirPath = path.join(stdout.trim(), ...subDirs)
  const existe = fs.pathExists(subDirPath)
  if (!existe) {
    throw new Error(`根目录下未找到${path.join(...subDirs)}目录`)
  }
  return subDirPath
}


/**
 * 查找sh脚本路径
 * @param shFilename sh脚本文件吗
 */
export const locateScripts = (shFilename: string): string => {
  return path.join(getRootPath(), 'scripts', shFilename)
}