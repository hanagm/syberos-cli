import * as fs from 'fs-extra'
import * as path from 'path'
import { PROJECT_CONFIG, DEVICES_TYPES } from '../util/constants'

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
