import * as fs from 'fs-extra'
import * as path from 'path'
import * as shelljs from 'shelljs'
import { AppBuildConfig, DEVICES_TYPES } from '../util/constants'
import { getTargetName } from '../syberos/helper'
import config from '../config/index'

export default class Build {
  private conf: any = {}
  private appPath: string
  private pdkRootPath: string
  private targetName: string

  constructor(appPath: string, config: AppBuildConfig) {
    this.appPath = appPath
    this.conf = { ...this.conf, ...config }
    this.pdkRootPath = this.pdkPath();
    this.targetName = getTargetName(this.appPath, this.conf.adapter)
  }

  /**
   * 开始编译
   */
  public async start() {
    console.log('开始编译：', this.appPath, JSON.stringify(this.conf))
    // 1、生成编译目录
    await this.mkdirBuild()
    // 2、拷贝www路径到模板下
    await this.copywww()
    // 3、执行构建命令
    await this.executeShell()
  }

  /**
   * 生成编译目录
   */
  private async mkdirBuild() {
    console.log('准备编译目录')
    const appPath = this.appPath
    const { adapter, debug } = this.conf

    // 定义编译目录
    const buildDir = `${appPath}/.build-${adapter}-${this.targetName}${debug ? '-Debug' : ''}`

    await fs.emptyDir(buildDir)
    shelljs.cd(buildDir)

    console.info('已创建编译目录：', buildDir)
  }

  /**
   * 拷贝www路径
   * @param appPath
   */
  private async copywww(appPath: string = this.appPath) {
    console.log('准备拷贝www目录')
    // const projectName = getProjectName(appPath)
    const wwwPath = path.join(appPath, config.SOURCE_DIR)

    // 模板目录
    const syberosPath = path.join(appPath, 'platforms', 'syberos', 'app', 'www')

    try {
      await fs.emptyDir(syberosPath)
      // 拷贝
      await fs.copy(wwwPath, syberosPath)
    } catch (err) {
      console.error(err)
      return
    }
    console.info('已拷贝www目录，From：', wwwPath, ' To：', syberosPath)
  }
  /**
   * 执行构建脚本
   */
  private async executeShell() {
    console.log('准备执行编译指令')
    // kchroot qmake
    this.execKchroot(this.qmakeCommand())
    // kchroot make
    this.execKchroot(this.makeCommand())
    // kchroot buildPkg
    this.execKchroot(this.buildPkgCommand())
    // exit
    shelljs.exit()
  }

  private execKchroot(subCommand: string = '') {
    const { adapter } = this.conf

    const kchroot = this.locateKchroot()

    let cmd = ''
    if (DEVICES_TYPES.DEVICE === adapter) {
      // 真机
      cmd += `${kchroot} 'sb2 -t ${this.targetName} -R'`
    } else if (DEVICES_TYPES.SIMULATOR === adapter) {
      // 模拟器
      cmd += `${kchroot} exec_${this.targetName}`
    } else {
      throw new Error('adapter类型错误')
    }

    if (cmd) {
      if (subCommand) {
        cmd += ` '${subCommand}'`
      }
      console.info('执行指令：', cmd)
      shelljs.exec(cmd)
    }
  }

  private qmakeCommand() {
    const { debug } = this.conf

    const qmake = this.locateQmake()
    const syberosPro = this.locateSyberosPro()

    const qmakeConfig = debug ? 'qml_debug' : 'release'

    return `${qmake} ${syberosPro} -r -spec linux-g++ CONFIG+=${qmakeConfig}`
  }

  private makeCommand() {
    return '/usr/bin/make'
  }

  private buildPkgCommand() {
    const syberosPro = this.locateSyberosPro()
    return `buildpkg ${syberosPro}`
  }

  /**
   * 查找PDK路径
   */
  private pdkPath() {
    const { stdout } = shelljs.exec(`env | grep ^HOME= | cut -c 6-`)
    const pdkPath = path.join(stdout.trim(), 'Syberos-Pdk')
    const existe = fs.pathExists(pdkPath)
    if (!existe) {
      throw new Error('根目录下未找到Sberos-Pdk目录')
    }
    return pdkPath
  }

  /**
   * 查找kchroot路径
   */
  private locateKchroot() {
    return path.join(this.pdkRootPath, 'sdk', 'script', 'kchroot')
  }
  /**
   * 查找qmake路径
   */
  private locateQmake() {
    return path.join(this.pdkRootPath, 'targets', this.targetName, 'usr', 'lib', 'qt5', 'bin', 'qmake')
  }
  /**
   * 查找项目中的syberos.pro文件路径
   */
  private locateSyberosPro() {
    return path.join(this.appPath, 'platforms', 'syberos', 'syberos.pro')
  }

}
