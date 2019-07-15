import * as fs from 'fs-extra'
import * as path from 'path'
import * as shelljs from 'shelljs'
import { AppBuildConfig } from '../util/constants'
import { getProjectName, getTargetName } from '../syberos/helper'
import config from '../config/index'

export default class Build {
  private conf: any = {}
  private appPath: string
  constructor(appPath: string, config: AppBuildConfig) {
    this.appPath = appPath
    this.conf = Object.assign(this.conf, config)
  }

  /**
   * 开始编译
   */
  public async start() {
    // 1、生成编译目录
    // await this.mkdirBuild()
    // 2、拷贝www路径到模板下
    // await this.copywww()
    // 3、执行构建命令

    this.executeShell()
  }

  /**
   * 生成编译目录
   * @param appPath 项目目录
   * @param targetName 编译的target
   */
  private async mkdirBuild() {
    const appPath = this.appPath
    const { adapter, target, debug } = this.conf
    // target
    let targetName: string = ''
    if (!target) {
      targetName = getTargetName(appPath, adapter)
    }
    const projectName = getProjectName(appPath)
    // 定义编译目录
    const buildDir = `${appPath}/.build-${projectName}-${targetName}${
      debug ? '-Debug' : ''
    }`
    await fs.emptyDir(buildDir)
  }

  /**
   * 拷贝www路径
   * @param appPath
   */
  private async copywww(appPath: string = this.appPath) {
    const projectName = getProjectName(appPath)
    const wwwPath = path.join(appPath, config.SOURCE_DIR)

    // 模板目录
    const syberosPath = path.join(appPath, 'platfroms', 'syberos', projectName)

    console.log('--www', wwwPath)
    console.log('--syberosPath', syberosPath)

    try {
      // 拷贝
      await fs.copy(wwwPath, syberosPath)
    } catch (err) {
      console.error(err)
    }
  }
  /**
   * 执行构建脚本
   */
  private async executeShell() {
    this.pdkPath()
    const kchroot = await this.locateKchroot()
    // const { target } = this.conf
    console.log('cmd', kchroot)

    // shelljs.exec(`${kchroot} 'sb2 -t ${target} -R'`, function(
    //   code,
    //   stdout,
    //   stderr
    // ) {
    //   console.log('Exit code:', code)
    //   console.log('Program output:', stdout)
    //   console.log('Program stderr:', stderr)

    //   shelljs.exec()
    // })
  }

  private async execQmake() {}

  private async localPdk() {
    const { stdout } = await shelljs.exec('locate ')
  }

  /**
   * 查找PDK路径
   */
  private async pdkPath() {
    const { stdout } = await shelljs.exec(`env | grep ^HOME= | cut -c 6-`)
    const pdkPath = path.join(stdout.trim(), 'Syberos-Pdk')
    const existe = await fs.pathExists(pdkPath)
    if (!existe) {
      throw new Error('根目录下未找到Sberos-Pdk目录')
    }
    return pdkPath
  }

  /**
   * 查找kchroot路径
   * @return {string} kchroot 路径
   */
  private async locateKchroot() {
    const pdkhome = await this.pdkPath()
    return path.join(pdkhome, 'sdk', 'script', 'kchroot')
  }
}
