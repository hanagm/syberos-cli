import { AppBuildConfig } from '../util/constants'
import Build from './build'

/**
 * 编译APP
 * @param appPath 工程目录
 * @param param1 参数信息
 */
export const build = (appPath: string, config: AppBuildConfig) => {
  const build = new Build(appPath, config)
  build.start()
}
