import * as fs from 'fs-extra'
import * as path from 'path'
import * as shelljs from 'shelljs'
import { AppBuildConfig, DEVICES_TYPES } from '../util/constants'
import { getProjectName, getTargetName } from '../syberos/helper'
import config from '../config/index'

export default class Build {
  private conf: any = {}
  private appPath: string
  constructor(appPath: string, config: AppBuildConfig) {
    this.appPath = appPath
    this.conf = { ...this.conf, ...config }
  }

  /**
   * 开始编译
   */
  public async start() {
    console.log('开始编译：', this.appPath)
    // 1、生成编译目录
    await this.mkdirBuild()
    // 2、拷贝www路径到模板下
    await this.copywww()
    // 3、执行构建命令
    await this.executeShell()
  }

  /**
   * 生成编译目录
   * @param appPath 项目目录
   * @param targetName 编译的target
   */
  private async mkdirBuild() {
    console.log('准备编译目录')
    const appPath = this.appPath
    const { adapter, debug } = this.conf

    // target
    const targetName = this.getTargetName()
    const projectName = getProjectName(appPath)
    // 定义编译目录
    const buildDir = `${appPath}/.build-${adapter}-${projectName}-${targetName}${
      debug ? '-Debug' : ''
    }`
    await fs.emptyDir(buildDir)

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
    const pdkPath = this.pdkPath()
    const targetName = this.getTargetName()
    // kchroot
    this.execKchroot(pdkPath, targetName)
    // qmake
    // this.execQmake(pdkPath, targetName)
    // // make
    // this.execMake()
    // // buildPkg
    // this.execBuildPkg()
  }

  private execKchroot(pdkRootPath: string, targetName: string) {
    const { adapter } = this.conf

    const kchroot = this.locateKchroot(pdkRootPath)

    let cmd = 'sudo '
    if (DEVICES_TYPES.DEVICE === adapter) {
      // 真机
      cmd += `${kchroot} 'sb2 -t ${targetName} -R'`
    } else if (DEVICES_TYPES.SIMULATOR === adapter) {
      // 模拟器
      cmd += `${kchroot} exec_${targetName}`
    } else {
      throw new Error('adapter类型错误')
    }

    if (cmd) {
      console.info('执行指令：', cmd)
      shelljs.exec(cmd, (code: number, stdout: string, stderr: string) => {
        console.log('----', stderr)
        this.execQmake(pdkRootPath, targetName)
      })
      // o.send(`/home/abeir/Syberos-Pdk/targets/target-armv7tnhl-xuanwu/usr/lib/qt5/bin/qmake /home/abeir/workspace/syberos/syberos-cli-test/test1/syberos.pro -r -spec linux-g++ CONFIG+=release`)
    }
  }

  private execQmake(
    pdkRootPath: string,
    targetName: string,
    appPath: string = this.appPath
  ) {
    const { debug } = this.conf

    const qmake = this.locateQmake(pdkRootPath, targetName)
    const syberosPro = this.locateSyberosPro()

    const qmakeConfig = debug ? 'qml_debug' : 'release'

    const cmd = `${qmake} ${syberosPro} -r -spec linux-g++ CONFIG+=${qmakeConfig}`
    console.info('执行指令：', cmd)
    shelljs.exec(cmd)
  }

  private execMake(make: string = '/usr/bin/make') {
    console.info('执行指令：', make)
    shelljs.exec(make)
  }

  private execBuildPkg() {
    const syberosPro = this.locateSyberosPro()
    const cmd = `buildpkg ${syberosPro}`
    console.info('执行指令：', cmd)
    shelljs.exec(cmd)
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
   * @return {string} kchroot 路径
   */
  private locateKchroot(pdkRootPath: string) {
    return path.join(pdkRootPath, 'sdk', 'script', 'kchroot')
  }
  /**
   * 查找qmake路径
   * @param pdkRootPath  pdk根目录
   * @param target target名称
   * @return {string} qmake 路径
   */
  private locateQmake(pdkRootPath: string, target: string) {
    return path.join(
      pdkRootPath,
      'target',
      target,
      'usr',
      'lib',
      'qt5',
      'bin',
      'qmake'
    )
  }
  /**
   * 查找项目中的syberos.pro文件路径
   * @param appPath 项目根目录
   * @return {string} syberos.pro文件路径
   */
  private locateSyberosPro(appPath: string = this.appPath) {
    return path.join(appPath, 'platforms', 'syberos', 'syberos.pro')
  }

  private getTargetName() {
    const { adapter, target } = this.conf
    if (target) {
      return target
    }
    return getTargetName(this.appPath, adapter)
  }
}
